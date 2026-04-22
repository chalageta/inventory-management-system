import db from '../config/db.js';

/**
 * @desc    Get all inventory items (flat OR grouped)
 * @route   GET /api/inventory
 */
export const getAllInventoryItems = async (req, res) => {
  try {
    const {
      product_id,
      status,
      search,
      page = 1,
      limit = 10,
      grouped,
      all // ✅ NEW
    } = req.query;

    const params = [];

    let baseQuery = `
      FROM inventory_items i
      LEFT JOIN products p ON i.product_id = p.id
      LEFT JOIN purchases pu ON i.purchase_id = pu.id
      LEFT JOIN sales s ON i.sale_id = s.id
      WHERE i.deleted_at IS NULL
AND p.deleted_at IS NULL
AND p.active = 1
    `;

    if (product_id) {
      baseQuery += ` AND i.product_id = ?`;
      params.push(product_id);
    }

    if (status) {
      baseQuery += ` AND i.status = ?`;
      params.push(status);
    }

    if (search) {
      baseQuery += ` AND i.serial_number LIKE ?`;
      params.push(`%${search}%`);
    }

    // ================= GROUPED =================
    if (grouped === "true") {
      const groupedQuery = `
        SELECT 
          p.id AS product_id,
          p.name AS product_name,
          COUNT(i.id) AS total,
          SUM(i.status = 'available') AS available,
          SUM(i.status = 'sold') AS sold
        ${baseQuery}
        GROUP BY p.id
        ORDER BY p.name ASC
      `;

      const [summary] = await db.execute(groupedQuery, params);

      const result = [];

      for (let row of summary) {
        const [items] = await db.execute(
          `
          SELECT 
            i.id,
            i.serial_number,
            i.status,
            i.purchase_id,
            s.reference AS sale_reference,
            s.customer_name
          FROM inventory_items i
          LEFT JOIN sales s ON i.sale_id = s.id
          WHERE i.product_id = ? AND i.deleted_at IS NULL
          ORDER BY i.created_at DESC
          `,
          [row.product_id]
        );

        result.push({ ...row, items });
      }

      return res.json({ data: result });
    }

    // ================= ✅ ALL MODE (NO PAGINATION) =================
    if (all === "true") {
      const dataQuery = `
        SELECT 
          i.*,
          p.name AS product_name,
          pu.invoice_no,
          s.reference AS sale_reference,
          s.customer_name
        ${baseQuery}
        ORDER BY i.created_at DESC
      `;

      const [items] = await db.execute(dataQuery, params);

      return res.json({
        data: items,
        pagination: null // optional
      });
    }

    // ================= PAGINATED =================
    const countQuery = `SELECT COUNT(*) AS total ${baseQuery}`;
    const [countResult] = await db.execute(countQuery, params);
    const total = countResult[0].total;

    const offset = (page - 1) * limit;

    const dataQuery = `
      SELECT 
        i.*,
        p.name AS product_name,
        pu.invoice_no,
        
        s.reference AS sale_reference,
        s.customer_name
      ${baseQuery}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [items] = await db.execute(dataQuery, [
      ...params,
      parseInt(limit),
      offset
    ]);

    res.json({
      data: items,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * @desc    Get single inventory item with logs
 * @route   GET /api/inventory/:id
 */
export const getInventoryItem = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT i.*, 
              p.name AS product_name,
              u1.name AS creator_name, 
              u2.name AS updater_name
       FROM inventory_items i
       LEFT JOIN products p ON i.product_id = p.id
       LEFT JOIN users u1 ON i.created_by = u1.id
       LEFT JOIN users u2 ON i.updated_by = u2.id
       WHERE i.id = ? AND i.deleted_at IS NULL`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    const [logs] = await db.execute(
      `SELECT sl.*, u.name AS user_name 
       FROM stock_logs sl
       LEFT JOIN users u ON sl.created_by = u.id
       WHERE sl.inventory_item_id = ?
       ORDER BY sl.created_at DESC`,
      [req.params.id]
    );

    res.json({
      ...rows[0],
      logs
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
/**
 * @desc    Add multiple inventory items + Create 'IN' Logs
 */
export const addInventoryItems = async (req, res) => {
  const { product_id, serial_numbers } = req.body;
  const userId = req.user?.id || 1;

  try {
    if (!product_id || !serial_numbers) {
      return res.status(400).json({ error: "Product ID and serial numbers are required" });
    }

    const serialsArray = Array.isArray(serial_numbers)
      ? serial_numbers
      : serial_numbers.split(',').map(s => s.trim());

    await db.beginTransaction();

    // Check for existing serials to avoid UNIQUE constraint errors
    const [existingSerials] = await db.query(
      `SELECT serial_number FROM inventory_items WHERE serial_number IN (?)`,
      [serialsArray]
    );
    const existingSet = new Set(existingSerials.map(item => item.serial_number));
    const newSerials = serialsArray.filter(sn => !existingSet.has(sn));

    if (!newSerials.length) throw new Error("All provided serial numbers already exist");

    for (const sn of newSerials) {
      // 1. Insert Item
      const [result] = await db.execute(
        `INSERT INTO inventory_items (product_id, serial_number, status, created_by) VALUES (?, ?, 'available', ?)`,
        [product_id, sn, userId]
      );

      const newItemId = result.insertId;

      // 2. Create Stock Log (Action: IN)
      await db.execute(
        `INSERT INTO stock_logs (inventory_item_id, product_id, action_type, from_status, to_status, note, created_by)
         VALUES (?, ?, 'IN', NULL, 'available', 'Initial stock entry', ?)`,
        [newItemId, product_id, userId]
      );
    }

    await db.commit();
    res.status(201).json({ message: `${newSerials.length} item(s) added successfully` });

  } catch (err) {
    await db.rollback();
    res.status(500).json({ error: err.message });
  }
};

/**
 * @desc    Update inventory item status + Log 'STATUS_CHANGE'
 */
export const updateInventoryItem = async (req, res) => {
  const itemId = req.params.id;
  const updates = req.body; // Expects { status: 'damaged', note: '...' }
  const userId = req.user?.id || 1;

  try {
    await db.beginTransaction();

    const [oldItem] = await db.execute(`SELECT status, product_id FROM inventory_items WHERE id = ?`, [itemId]);
    if (!oldItem.length) return res.status(404).json({ error: "Item not found" });

    const oldStatus = oldItem[0].status;
    const productId = oldItem[0].product_id;

    // Filter updates to only allowed fields
    const allowedFields = ['status', 'active', 'sale_id'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => { obj[key] = updates[key]; return obj; }, {});

    if (Object.keys(filteredUpdates).length > 0) {
      const fields = Object.keys(filteredUpdates).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(filteredUpdates), userId, itemId];

      await db.execute(
        `UPDATE inventory_items SET ${fields}, updated_by = ? WHERE id = ?`,
        values
      );

      // Log status change if status was updated
      if (filteredUpdates.status && filteredUpdates.status !== oldStatus) {
        await db.execute(
          `INSERT INTO stock_logs (inventory_item_id, product_id, action_type, from_status, to_status, note, created_by)
           VALUES (?, ?, 'STATUS_CHANGE', ?, ?, ?, ?)`,
          [itemId, productId, oldStatus, filteredUpdates.status, updates.note || 'Status update', userId]
        );
      }
    }

    await db.commit();
    res.json({ message: "Inventory item updated successfully" });
  } catch (err) {
    await db.rollback();
    res.status(500).json({ error: err.message });
  }
};

/**
 * @desc    Archive (Soft Delete) + Create Log 'ADJUSTMENT'
 */
export const archiveInventoryItem = async (req, res) => {
  const itemId = req.params.id;
  const userId = req.user?.id || 1;

  try {
    await db.beginTransaction();

    const [item] = await db.execute(`SELECT status, product_id FROM inventory_items WHERE id = ?`, [itemId]);
    if (!item.length) return res.status(404).json({ error: "Item not found" });

    // 1. Mark as inactive and set deleted_at
    await db.execute(
      `UPDATE inventory_items SET active = FALSE, deleted_at = NOW(), updated_by = ? WHERE id = ?`,
      [userId, itemId]
    );

    // 2. Log as ADJUSTMENT per your ENUM schema
    await db.execute(
      `INSERT INTO stock_logs (inventory_item_id, product_id, action_type, from_status, to_status, note, created_by)
       VALUES (?, ?, 'ARCHIVE', ?, 'archived', 'Item moved to archive', ?)`,
      [itemId, item[0].product_id, item[0].status, userId]
    );

    await db.commit();
    res.json({ message: "Inventory item archived" });
  } catch (err) {
    await db.rollback();
    res.status(500).json({ error: err.message });
  }
};