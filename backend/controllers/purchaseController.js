import db from '../config/db.js';

/**
 * CREATE PURCHASE (PURCHASER ROLE)
 */export const createPurchase = async (req, res) => {
  let {
    product_id,
    supplier_name = null,
    supplier_phone = null,
    invoice_no = null,
    total_items,
    total_cost = null,
    unit_cost = null,
    location = null,
    serial_number = null,
    lot_number = null,
    expiry_date = null,
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

    if (unit_cost && !total_cost) {
      total_cost = (Number(unit_cost) * Number(total_items)).toFixed(2);
    } else if (!unit_cost && total_cost) {
      unit_cost = (Number(total_cost) / Number(total_items)).toFixed(2);
    } else if (unit_cost && total_cost) {
      const calculated = Number(unit_cost) * Number(total_items);

      if (Math.abs(calculated - Number(total_cost)) > 0.01) {
        return res.status(400).json({
          error: "unit_cost × total_items must equal total_cost"
        });
      }
    } else {
      unit_cost = null;
      total_cost = null;
       location = null,
       serial_number = null,
       lot_number = null,
       expiry_date = null
    }

    // =========================
    // INSERT
    // =========================
    const [result] = await db.execute(
      `INSERT INTO purchases
      (product_id, supplier_name, supplier_phone, invoice_no,
       unit_cost, total_cost, total_items, note, location,serial_number,lot_number,expiry_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product_id,
        supplier_name,
        supplier_phone,
        invoice_no,
        unit_cost,
        total_cost,
        total_items,
        note,
        location,
        serial_number,
        lot_number,
        expiry_date,
        userId
      ]
    );

    res.status(201).json({
      message: "Purchase created successfully",
      purchase_id: result.insertId,
      supplier_name,
      supplier_phone,
      unit_cost,
      total_cost,
      location,
      serial_number,
      lot_number,
      expiry_date
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
      total_items,
      unit_cost,
      total_cost,
      location,
      serial_number,
      lot_number,
      expiry_date,
      note
    } = req.body;

    // ✅ FIX: fallback old values + convert undefined → null
    const data = {
      product_id: product_id ?? old.product_id,
      supplier_name: supplier_name ?? old.supplier_name,
      supplier_phone: supplier_phone ?? old.supplier_phone,
      invoice_no: invoice_no ?? old.invoice_no,
         total_items: total_items ?? old.total_items,
      unit_cost: unit_cost ?? old.unit_cost,
      total_cost: total_cost ?? old.total_cost,
      note: note ?? old.note,
      location: location ?? old.location,
      serial_number: serial_number ?? old.serial_number,
      lot_number: lot_number ?? old.lot_number,
      expiry_date: expiry_date ?? old.expiry_date,
      updated_by: userId
    };

    await db.execute(
      `UPDATE purchases
       SET product_id=?,
           supplier_name=?,
           supplier_phone=?,
           invoice_no=?,
             total_items=?,
           unit_cost=?,
           total_cost=?,
           note=?,
           location=?,
           serial_number=?,
           lot_number=?,
           expiry_date=?,
           updated_by=?
       WHERE id=?`,
      [
        data.product_id,
        data.supplier_name,
        data.supplier_phone,
        data.invoice_no,
        data.total_items,
        data.unit_cost,
        data.total_cost,
        data.note,
        data.location,
        data.serial_number,
        data.lot_number,
        data.expiry_date,
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

    const purchase = rows[0];

    if (purchase.status !== "pending") {
      await db.rollback();
      return res.status(400).json({ error: "Already processed" });
    }

    if (!purchase.product_id) {
      await db.rollback();
      return res.status(400).json({ error: "Product not linked" });
    }

    // prevent duplicate
    const [existing] = await db.execute(
      `SELECT COUNT(*) AS count FROM inventory_items WHERE purchase_id = ?`,
      [purchaseId]
    );

    if (existing[0].count > 0) {
      await db.rollback();
      return res.status(400).json({
        error: "Inventory already exists for this purchase"
      });
    }

    const inventoryValues = [];

    const baseSerial = purchase.serial_number; // ⭐ IMPORTANT FIX

    const unitCost =
      purchase.unit_cost !== null ? Number(purchase.unit_cost) : null;

    for (let i = 1; i <= purchase.total_items; i++) {
      const serial =
        purchase.total_items === 1
          ? baseSerial
          : `${baseSerial}-${i}`;

      inventoryValues.push([
        purchase.product_id,
        purchase.id,
        serial,
        unitCost,
        purchase.location,
        "available",
        userId
      ]);
    }

    await db.query(
      `INSERT INTO inventory_items
       (product_id, purchase_id, serial_number, cost_price, location, status, created_by)
       VALUES ?`,
      [inventoryValues]
    );

    await db.execute(
      `UPDATE purchases SET status='approved', updated_by=? WHERE id=?`,
      [userId, purchaseId]
    );

    await db.commit();

    res.json({
      message: "Purchase approved and inventory created",
      created_items: purchase.total_items
    });

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
    // 2. VALIDATIONS
    // =========================
    if (purchase.status === "received") {
      await db.rollback();
      return res.status(400).json({
        error: "Already received"
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
      return res.status(400).json({
        error: "Product not linked"
      });
    }

    // =========================
    // 3. OPTIONAL: PREVENT DUPLICATE INVENTORY CHECK
    // =========================
    const [existing] = await db.execute(
      `SELECT COUNT(*) AS count FROM inventory_items WHERE purchase_id = ?`,
      [purchaseId]
    );

    if (existing[0].count > 0) {
      await db.rollback();
      return res.status(400).json({
        error: "Inventory already exists for this purchase"
      });
    }

    // =========================
    // 4. ONLY UPDATE STATUS (NO INVENTORY HERE)
    // =========================
    await db.execute(
      `UPDATE purchases SET status='received', updated_by=? WHERE id=?`,
      [userId, purchaseId]
    );

    // =========================
    // 5. LOG EVENT
    // =========================
    await db.execute(
      `INSERT INTO stock_logs
       (purchase_id, inventory_item_id, product_id, action_type, from_status, to_status, note, created_by)
       VALUES (?, NULL, ?, 'PURCHASE_RECEIVED', 'approved', 'received', ?, ?)`,
      [
        purchaseId,
        purchase.product_id,
        `Purchase received #${purchaseId}`,
        userId
      ]
    );

    await db.commit();

    res.json({
      message: "Purchase marked as received successfully"
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
      where += ` AND (p.supplier_name LIKE ? OR p.invoice_no LIKE ? OR p.location   LIKE ? OR p.serial_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%` , `%${search}%`, `%${search}%`);
    }

    const [rows] = await db.execute(
      `
      SELECT 
        p.id,
        p.product_id,
        p.supplier_name,
        p.supplier_phone,
        p.invoice_no,
        p.unit_cost,       
        p.total_cost,
        p.total_items,

        p.status,
        p.note,
        p.location,
        p.serial_number,
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
        u.name AS created_by,
        u2.name AS updated_by,
        u3.name AS approver_name,
        u4.name AS receiver_name
      FROM purchases p
      LEFT JOIN products pr ON p.product_id = pr.id
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN users u2 ON p.updated_by = u2.id
      LEFT JOIN users u3 ON p.approved_by = u3.id
      LEFT JOIN users u4 ON p.received_by = u4.id
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