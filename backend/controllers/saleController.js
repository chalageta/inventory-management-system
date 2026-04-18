import db from '../config/db.js';

/**
 * =========================
 * CREATE SALE (FIXED)
 * =========================
 */

export const createSale = async (req, res) => {
  try {
    const { customer_name, items } = req.body;
    const userId = req.user?.id;

    if (!customer_name || !items?.length) {
      return res.status(400).json({ error: "Customer name and items required" });
    }

    await db.beginTransaction();

    const reference = `SO-${Date.now()}`;
    let totalAmount = 0;

    // =========================
    // CREATE SALE
    // =========================
    const [saleResult] = await db.execute(
      `INSERT INTO sales (reference, user_id, customer_name, status)
       VALUES (?, ?, ?, 'Approved')`,
      [reference, userId, customer_name]
    );

    const saleId = saleResult.insertId;

    const stockLogs = [];

    // =========================
    // PROCESS ITEMS
    // =========================
    for (const item of items) {

      const [rows] = await db.execute(
        `SELECT id, product_id, status, cost_price
         FROM inventory_items
         WHERE id = ? AND status = 'available'
         FOR UPDATE`,
        [item.inventory_item_id]
      );

      if (!rows.length) throw new Error("Item not available");

      const inv = rows[0];

      const costPrice = Number(inv.cost_price || 0);
      const salePrice = item.sale_price > 0 ? Number(item.sale_price) : costPrice;

      totalAmount += salePrice;

      // =========================
      // INSERT SALE ITEM
      // =========================
      await db.execute(
        `INSERT INTO sale_items
        (sale_id, product_id, inventory_item_id, quantity, cost_price, sale_price)
        VALUES (?, ?, ?, 1, ?, ?)`,
        [saleId, inv.product_id, inv.id, costPrice, salePrice]
      );

      // =========================
      // UPDATE INVENTORY → RESERVED
      // =========================
      await db.execute(
        `UPDATE inventory_items
         SET status = 'sold', sale_id = ?
         WHERE id = ?`,
        [saleId, inv.id]
      );

      // =========================
      // 🔥 STOCK LOG (IMPORTANT)
      // =========================
      stockLogs.push([
        null,                  // purchase_id
        inv.id,                // inventory_item_id
        inv.product_id,
        'SOLD',            // action_type
        'available',           // from_status
        'sold',            // to_status
        `Sale #${reference} approved`,
        userId
      ]);
    }

    // =========================
    // INSERT STOCK LOGS
    // =========================
    if (stockLogs.length) {
      await db.query(
        `INSERT INTO stock_logs
         (purchase_id, inventory_item_id, product_id, action_type, from_status, to_status, note, created_by)
         VALUES ?`,
        [stockLogs]
      );
    }

    // =========================
    // UPDATE TOTAL
    // =========================
    await db.execute(
      `UPDATE sales SET total_amount = ? WHERE id = ?`,
      [totalAmount, saleId]
    );

    await db.commit();

    res.status(201).json({
      success: true,
      saleId,
      reference,
      totalAmount
    });

  } catch (err) {
    await db.rollback();
    res.status(500).json({ error: err.message });
  }
};

export const approveSale = async (req, res) => {
  try {
    await db.execute(
      `UPDATE sales SET status = 'Approved' WHERE id = ?`,
      [req.params.id]
    );

    res.json({ message: "Sale approved by finance" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const rejectSale = async (req, res) => {
  try {
    await db.beginTransaction();

    await db.execute(
      `UPDATE inventory_items
       SET status = 'available', sale_id = NULL
       WHERE sale_id = ?`,
      [req.params.id]
    );

    await db.execute(
      `UPDATE sales SET status = 'Rejected' WHERE id = ?`,
      [req.params.id]
    );

    await db.commit();

    res.json({ message: "Sale rejected" });

  } catch (err) {
    await db.rollback();
    res.status(500).json({ error: err.message });
  }
};
export const completeSale = async (req, res) => {
  try {
    const saleId = req.params.id;

    await db.beginTransaction();

    // 1. Check sale status
    const [sale] = await db.execute(
      `SELECT status FROM sales WHERE id = ?`,
      [saleId]
    );

    if (!sale.length) {
      throw new Error("Sale not found");
    }

    if (sale[0].status !== 'Approved') {
      throw new Error("Sale must be Approved first");
    }

    // 2. Get reserved items (SAFE UPDATE TARGET)
    const [items] = await db.execute(
      `SELECT id FROM inventory_items 
       WHERE sale_id = ? AND status = 'reserved'`,
      [saleId]
    );

    if (!items.length) {
      throw new Error("No reserved items found for this sale");
    }

    // 3. UPDATE INVENTORY → SOLD
    await db.execute(
      `UPDATE inventory_items
       SET status = 'sold'
       WHERE sale_id = ? AND status = 'reserved'`,
      [saleId]
    );

    // 4. UPDATE SALE
    await db.execute(
      `UPDATE sales SET status = 'Completed' WHERE id = ?`,
      [saleId]
    );

    await db.commit();

    res.json({
      success: true,
      message: "Sale completed and inventory marked as sold"
    });

  } catch (error) {
    await db.rollback();
    res.status(500).json({ error: error.message });
  }
};
/**
 * =========================
 * GET SINGLE SALE
 * =========================
 */
export const getSale = async (req, res) => {
  try {
    const saleId = req.params.id;

    const [saleRows] = await db.execute(
      `SELECT s.*, u.name as user_name
       FROM sales s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [saleId]
    );

    if (!saleRows.length) {
      return res.status(404).json({ error: "Sale not found" });
    }

    const [items] = await db.execute(
      `SELECT
         si.id,
         si.quantity,
         si.cost_price,
         si.sale_price,
         si.profit,
         p.name as product_name,
         ii.serial_number
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN inventory_items ii ON si.inventory_item_id = ii.id
       WHERE si.sale_id = ?`,
      [saleId]
    );

    res.json({
      ...saleRows[0],
      items
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * =========================
 * UPDATE SALE STATUS
 * =========================
 */export const updateSaleStatus = async (req, res) => {
  try {
    const saleId = req.params.id;
    const { status } = req.body;

    await db.beginTransaction();

    if (status === 'Cancelled') {
      await db.execute(
        `UPDATE inventory_items
         SET status = 'available', sale_id = NULL
         WHERE sale_id = ?`,
        [saleId]
      );
    }

    await db.execute(
      `UPDATE sales SET status = ? WHERE id = ?`,
      [status, saleId]
    );

    await db.commit();

    res.json({
      message: `Status updated to ${status}`
    });

  } catch (error) {
    await db.rollback();

    res.status(500).json({ error: error.message });
  }
};
/**
 * =========================
 * GET ALL SALES
 * =========================
 */
export const getAllSales = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let where = `s.deleted_at IS NULL`;
    const params = [];

    if (search) {
      where += ` AND (s.customer_name LIKE ? OR s.reference LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const [count] = await db.execute(
      `SELECT COUNT(*) as total FROM sales s WHERE ${where}`,
      params
    );

    const [sales] = await db.execute(
      `SELECT s.*, u.name as user_name
       FROM sales s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE ${where}
       ORDER BY s.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    res.json({
      data: sales,
      pagination: {
        totalItems: count[0].total,
        totalPages: Math.ceil(count[0].total / limit),
        currentPage: page,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * =========================
 * ARCHIVE SALE
 * =========================
 */
export const archiveSale = async (req, res) => {
  try {
    await db.execute(
      `UPDATE sales SET deleted_at = NOW() WHERE id = ?`,
      [req.params.id]
    );

    res.json({ message: "Sale archived successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const getSaleReceipt = async (req, res) => {
  try {
    const saleId = req.params.id;

    // 1. Check sale status first
    const [sale] = await db.execute(
      `SELECT status FROM sales WHERE id = ?`,
      [saleId]
    );

    if (!sale.length) {
      return res.status(404).json({ error: "Sale not found" });
    }

    // ❌ BLOCK if not approved or completed
    if (!['Approved', 'Completed'].includes(sale[0].status)) {
      return res.status(403).json({
        error: "Receipt can only be generated after Finance approval or completion"
      });
    }

    // 2. Generate receipt
    const [rows] = await db.execute(
      `SELECT
         s.reference,
         s.customer_name,
         s.created_at,
         s.total_amount,
         u.name as cashier,
         si.quantity,
         si.cost_price,
         si.sale_price,
         si.profit,
         p.name as product_name,
         p.uom,
         GROUP_CONCAT(ii.serial_number) as serials
       FROM sales s
       JOIN sale_items si ON s.id = si.sale_id
       JOIN products p ON si.product_id = p.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN inventory_items ii
         ON ii.sale_id = s.id
         AND ii.product_id = p.id
       WHERE s.id = ?
       GROUP BY si.id`,
      [saleId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    res.json({
      header: {
        company: "Gilando Biomedical Solutions",
        address: "Addis Ababa, Ethiopia",
        reference: rows[0].reference,
        date: rows[0].created_at,
        cashier: rows[0].cashier,
        customer: rows[0].customer_name
      },
      items: rows.map(r => ({
        name: r.product_name,
        qty: r.quantity,
        cost_price: r.cost_price,
        sale_price: r.sale_price,
        profit: r.profit,
        serials: r.serials
      })),
      summary: {
        total: rows[0].total_amount
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};