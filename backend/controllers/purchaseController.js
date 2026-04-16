import db from '../config/db.js';

/**
 * CREATE PURCHASE (PURCHASER ROLE)
 */export const createPurchase = async (req, res) => {
  let {
    product_id,
    supplier_name = null,
    supplier_phone = null,
    invoice_no = null,
    reference = null,
    total_items,
    total_amount = null,
    unit_price = null,
    note = null
  } = req.body;

  const userId = req.user?.id || null;

  try {
    // =========================
    // REQUIRED VALIDATION (UPDATED)
    // =========================
    if (!product_id || !total_items) {
      return res.status(400).json({
        error: "product, total_items are required"
      });
    }

    if (total_items <= 0) {
      return res.status(400).json({
        error: "total_items must be greater than 0"
      });
    }

    // =========================
    // PRICE LOGIC (OPTIONAL)
    // =========================

    if (unit_price && !total_amount) {
      total_amount = (Number(unit_price) * Number(total_items)).toFixed(2);
    } else if (!unit_price && total_amount) {
      unit_price = (Number(total_amount) / Number(total_items)).toFixed(2);
    } else if (unit_price && total_amount) {
      const calculated = Number(unit_price) * Number(total_items);

      if (Math.abs(calculated - Number(total_amount)) > 0.01) {
        return res.status(400).json({
          error: "unit_price × total_items must equal total_amount"
        });
      }
    } else {
      unit_price = null;
      total_amount = null;
    }

    // =========================
    // INSERT
    // =========================
    const [result] = await db.execute(
      `INSERT INTO purchases
      (product_id, supplier_name, supplier_phone, invoice_no, reference,
       unit_price, total_amount, total_items, note, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product_id,
        supplier_name,
        supplier_phone,
        invoice_no,
        reference,
        unit_price,
        total_amount,
        total_items,
        note,
        userId
      ]
    );

    res.status(201).json({
      message: "Purchase created successfully",
      purchase_id: result.insertId,
      supplier_name,
      supplier_phone,
      unit_price,
      total_amount
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const updatePurchase = async (req, res) => {
  const purchaseId = req.params.id;
  const userId = req.user?.id;

  try {
    const [rows] = await db.execute(
      `SELECT * FROM purchases WHERE id=? AND deleted_at IS NULL`,
      [purchaseId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    // ONLY PENDING CAN BE EDITED
    if (rows[0].status !== "pending") {
      return res.status(400).json({
        error: "Only pending purchases can be updated"
      });
    }

    const old = rows[0];

    const {
      product_id,
      supplier_name,
      supplier_phone,
      invoice_no,
      reference,
      total_items,
      unit_price,
      total_amount,
      note
    } = req.body;

    // ✅ FIX: fallback old values + convert undefined → null
    const data = {
      product_id: product_id ?? old.product_id,
      supplier_name: supplier_name ?? old.supplier_name,
      supplier_phone: supplier_phone ?? old.supplier_phone,
      invoice_no: invoice_no ?? old.invoice_no,
      reference: reference ?? old.reference,
      total_items: total_items ?? old.total_items,
      unit_price: unit_price ?? old.unit_price,
      total_amount: total_amount ?? old.total_amount,
      note: note ?? old.note,
      updated_by: userId
    };

    await db.execute(
      `UPDATE purchases
       SET product_id=?,
           supplier_name=?,
           supplier_phone=?,
           invoice_no=?,
           reference=?,
           total_items=?,
           unit_price=?,
           total_amount=?,
           note=?,
           updated_by=?
       WHERE id=?`,
      [
        data.product_id,
        data.supplier_name,
        data.supplier_phone,
        data.invoice_no,
        data.reference,
        data.total_items,
        data.unit_price,
        data.total_amount,
        data.note,
        data.updated_by,
        purchaseId
      ]
    );

    res.json({ message: "Purchase updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const approvePurchase = async (req, res) => {
  const purchaseId = req.params.id;
  const userId = req.user?.id;

  try {
    await db.beginTransaction();

    const [rows] = await db.execute(
      `SELECT * FROM purchases WHERE id = ? AND deleted_at IS NULL`,
      [purchaseId]
    );

    if (!rows.length) {
      await db.rollback();
      return res.status(404).json({ error: "Purchase not found" });
    }

    if (rows[0].status !== "pending") {
      await db.rollback();
      return res.status(400).json({ error: "Already processed" });
    }

    // update status
    await db.execute(
      `UPDATE purchases SET status='approved', updated_by=? WHERE id=?`,
      [userId, purchaseId]
    );

    // 🔥 FIXED STOCK LOG
    await db.execute(
      `INSERT INTO stock_logs
       (purchase_id, inventory_item_id, product_id, action_type, from_status, to_status, note, created_by)
       VALUES (?, NULL, ?, 'PURCHASE_APPROVED', 'pending', 'approved', ?, ?)`,
      [
        purchaseId,
        rows[0].product_id,
        `Purchase #${purchaseId} approved`,
        userId
      ]
    );

    await db.commit();

    res.json({ message: "Purchase approved successfully" });

  } catch (err) {
    await db.rollback();
    res.status(500).json({ error: err.message });
  }
};

export const receivePurchase = async (req, res) => {
  const purchaseId = req.params.id;
  const userId = req.user?.id;

  try {
    await db.beginTransaction();

    // =========================
    // 1. GET PURCHASE
    // =========================
    const [rows] = await db.execute(
      `SELECT * FROM purchases WHERE id = ? AND deleted_at IS NULL`,
      [purchaseId]
    );

    if (!rows.length) {
      await db.rollback();
      return res.status(404).json({ error: "Purchase not found" });
    }

    const purchase = rows[0];

    // =========================
    // 2. BLOCK DUPLICATE RECEIVE (IMPORTANT FIX)
    // =========================
    if (purchase.status === "received") {
      await db.rollback();
      return res.status(400).json({
        error: "Purchase already received. Inventory already created."
      });
    }

    if (purchase.status !== "approved") {
      await db.rollback();
      return res.status(400).json({
        error: "Purchase must be approved first"
      });
    }

    if (!purchase.product_id) {
      await db.rollback();
      return res.status(400).json({ error: "Product not linked to purchase" });
    }

    // =========================
    // 3. EXTRA SAFETY: CHECK IF INVENTORY EXISTS
    // =========================
    const [existingItems] = await db.execute(
      `SELECT COUNT(*) AS count FROM inventory_items WHERE purchase_id = ?`,
      [purchaseId]
    );

    if (existingItems[0].count > 0) {
      await db.rollback();
      return res.status(400).json({
        error: "Inventory already exists for this purchase"
      });
    }

    // =========================
    // 4. BUILD INVENTORY DATA
    // =========================
    const batchNo = `BATCH-${purchase.id}-${Date.now()}`;
    const inventoryValues = [];
    const itemLogs = [];

    const unitCost =
      purchase.unit_price !== null && purchase.unit_price !== undefined
        ? Number(purchase.unit_price)
        : null;

    for (let i = 1; i <= purchase.total_items; i++) {
      const serial = `${batchNo}-${i}`;

      inventoryValues.push([
        purchase.product_id,
        purchase.id,
        batchNo,
        serial,
        unitCost, // can be null
        'available',
        userId
      ]);
    }

    // =========================
    // 5. INSERT INVENTORY
    // =========================
    const [insertResult] = await db.query(
      `INSERT INTO inventory_items
       (product_id, purchase_id, batch_no, serial_number, cost_price, status, created_by)
       VALUES ?`,
      [inventoryValues]
    );

    // =========================
    // 6. STOCK LOGS
    // =========================
    let startId = insertResult.insertId;

    for (let i = 0; i < purchase.total_items; i++) {
      itemLogs.push([
        purchaseId,
        startId + i,
        purchase.product_id,
        'IN',
        null,
        'available',
        `Received via purchase #${purchase.id}`,
        userId
      ]);
    }

    if (itemLogs.length) {
      await db.query(
        `INSERT INTO stock_logs
         (purchase_id, inventory_item_id, product_id, action_type, from_status, to_status, note, created_by)
         VALUES ?`,
        [itemLogs]
      );
    }

    // =========================
    // 7. EVENT LOG
    // =========================
    await db.execute(
      `INSERT INTO stock_logs
       (purchase_id, inventory_item_id, product_id, action_type, from_status, to_status, note, created_by)
       VALUES (?, NULL, ?, 'PURCHASE_RECEIVED', 'approved', 'available', ?, ?)`,
      [
        purchaseId,
        purchase.product_id,
        `Stock received via purchase #${purchaseId}, batch ${batchNo}`,
        userId
      ]
    );

    // =========================
    // 8. UPDATE STATUS
    // =========================
    await db.execute(
      `UPDATE purchases SET status='received', updated_by=? WHERE id=?`,
      [userId, purchaseId]
    );

    await db.commit();

    res.json({
      message: "Stock received successfully",
      batch_no: batchNo,
      created_items: purchase.total_items
    });

  } catch (err) {
    await db.rollback();
    res.status(500).json({ error: err.message });
  }
};
export const getPurchases = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const status = req.query.status || null;
    const search = req.query.search || '';

    let where = `WHERE p.deleted_at IS NULL`;
    const params = [];

    if (status) {
      where += ` AND p.status = ?`;
      params.push(status);
    }

    if (search) {
      where += ` AND (p.supplier_name LIKE ? OR p.invoice_no LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await db.execute(
      `
      SELECT 
        p.id,
        p.product_id,
        p.supplier_name,
        p.supplier_phone,
        p.invoice_no,
        p.reference,

        p.unit_price,        -- ✅ ADD THIS
        p.total_amount,
        p.total_items,

        p.status,
        p.note,
        p.reason,
        p.created_at,
        p.updated_at,

        pr.name AS product_name,
        u.name AS created_by

      FROM purchases p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN products pr ON p.product_id = pr.id

      ${where}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    const [countResult] = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM purchases p
      ${where}
      `,
      params
    );

    const total = countResult[0].total;

    res.json({
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePurchase = async (req, res) => {
  const purchaseId = req.params.id;
  const userId = req.user?.id;

  try {
    const [rows] = await db.execute(
      `SELECT * FROM purchases WHERE id=?`,
      [purchaseId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Not found" });
    }

    if (rows[0].status === "received") {
      return res.status(400).json({ error: "Cannot delete received purchase" });
    }

    await db.execute(
      `UPDATE purchases SET deleted_at = NOW(), updated_by=? WHERE id=?`,
      [userId, purchaseId]
    );

    res.json({ message: "Purchase deleted (soft delete)" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const rejectPurchase = async (req, res) => {
  const purchaseId = req.params.id;
  const { reason } = req.body;
  const userId = req.user?.id;

  try {
    const [rows] = await db.execute(
      `SELECT * FROM purchases WHERE id=? AND deleted_at IS NULL`,
      [purchaseId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Not found" });
    }

    if (rows[0].status === "received") {
      return res.status(400).json({ error: "Cannot reject received purchase" });
    }

    await db.execute(
      `UPDATE purchases 
       SET status='cancelled', reason=?, updated_by=? 
       WHERE id=?`,
      [reason || null, userId, purchaseId]
    );

    res.json({ message: "Purchase rejected with reason" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getPurchaseDetail = async (req, res) => {
  const purchaseId = req.params.id;

  try {
    // =========================
    // 1. PURCHASE DATA
    // =========================
    const [purchaseRows] = await db.execute(
      `
      SELECT 
        p.*,
        pr.name AS product_name,
        u.name AS created_by
      FROM purchases p
      LEFT JOIN products pr ON p.product_id = pr.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ? AND p.deleted_at IS NULL
      `,
      [purchaseId]
    );

    if (!purchaseRows.length) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    const purchase = purchaseRows[0];

    // =========================
    // 2. APPROVER (ROBUST FIX)
    // =========================
    const [approved] = await db.execute(
      `
      SELECT u.name, sl.created_at
      FROM stock_logs sl
      LEFT JOIN users u ON sl.created_by = u.id
      WHERE sl.purchase_id = ?
        AND sl.action_type = 'PURCHASE_APPROVED'
      ORDER BY sl.created_at DESC
      LIMIT 1
      `,
      [purchaseId]
    );

    // =========================
    // 3. RECEIVER (ROBUST FIX)
    // =========================
    const [received] = await db.execute(
      `
      SELECT u.name, sl.created_at
      FROM stock_logs sl
      LEFT JOIN users u ON sl.created_by = u.id
      WHERE sl.purchase_id = ?
        AND sl.action_type = 'PURCHASE_RECEIVED'
      ORDER BY sl.created_at DESC
      LIMIT 1
      `,
      [purchaseId]
    );

    // =========================
    // 4. FALLBACK (VERY IMPORTANT FIX)
    // =========================
    let approver = approved[0] || null;
    let receiver = received[0] || null;

    // 🔥 fallback using product_id (for OLD DATA)
    if (!approver && purchase.status !== 'pending') {
      const [fallbackApproved] = await db.execute(
        `
        SELECT u.name, sl.created_at
        FROM stock_logs sl
        LEFT JOIN users u ON sl.created_by = u.id
        WHERE sl.product_id = ?
          AND sl.action_type = 'PURCHASE_APPROVED'
        ORDER BY sl.created_at DESC
        LIMIT 1
        `,
        [purchase.product_id]
      );

      approver = fallbackApproved[0] || null;
    }

    if (!receiver && purchase.status === 'received') {
      const [fallbackReceived] = await db.execute(
        `
        SELECT u.name, sl.created_at
        FROM stock_logs sl
        LEFT JOIN users u ON sl.created_by = u.id
        WHERE sl.product_id = ?
          AND sl.action_type = 'PURCHASE_RECEIVED'
        ORDER BY sl.created_at DESC
        LIMIT 1
        `,
        [purchase.product_id]
      );

      receiver = fallbackReceived[0] || null;
    }

// =========================
// 5. INVENTORY ITEMS (UPDATED)
// =========================
const [items] = await db.execute(
  `
  SELECT 
    id,
    purchase_id,
    product_id,
    serial_number,
    batch_no,
    cost_price,
    status,
    created_at
  FROM inventory_items
  WHERE purchase_id = ?
  ORDER BY created_at ASC
  `,
  [purchaseId]
);

    // =========================
    // 6. RESPONSE
    // =========================
    res.json({
      purchase,
      approver,
      receiver,
      items
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};