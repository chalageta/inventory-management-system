import db from '../config/db.js';

/**
 * =========================
 * DATE FILTER HELPER
 * =========================
 */
const getDateFilters = (startDate, endDate, alias = 's') => {
  let conditions = '';
  const params = [];

  if (startDate) {
    conditions += ` AND ${alias}.created_at >= ?`;
    params.push(`${startDate} 00:00:00`);
  }

  if (endDate) {
    conditions += ` AND ${alias}.created_at <= ?`;
    params.push(`${endDate} 23:59:59`);
  }

  return { conditions, params };
};


export const getStatsSummary = async (req, res) => {
  try {
    // =========================
    // PRODUCTS (FIXED)
    // =========================
    const [[products]] = await db.execute(`
      SELECT COUNT(*) AS total
      FROM products
      WHERE deleted_at IS NULL
      AND active = 1
    `);

    // =========================
    // CATEGORIES (FIXED)
    // =========================
    const [[categories]] = await db.execute(`
      SELECT COUNT(*) AS total
      FROM categories
      WHERE deleted_at IS NULL
      AND active = 1
    `);

    // =========================
    // PURCHASES (SOFT DELETE SAFE)
    // =========================
    const [[purchases]] = await db.execute(`
      SELECT COUNT(*) AS total
      FROM purchases
      WHERE deleted_at IS NULL
    `);

    // =========================
    // SALES (SOFT DELETE SAFE)
    // =========================
    const [[sales]] = await db.execute(`
      SELECT COUNT(*) AS total
      FROM sales
      WHERE deleted_at IS NULL
    `);

    // =========================
    // INVENTORY (FIXED)
    // =========================
    const [[inventoryRaw]] = await db.execute(`
      SELECT 
        COUNT(*) AS total_items,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available,
        SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) AS sold,
        SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) AS reserved
      FROM inventory_items
      WHERE deleted_at IS NULL
    `);

    const inventory = {
      total_items: Number(inventoryRaw.total_items || 0),
      available: Number(inventoryRaw.available || 0),
      sold: Number(inventoryRaw.sold || 0),
      reserved: Number(inventoryRaw.reserved || 0),
    };

    // =========================
    // LOW STOCK (FIXED LOGIC)
    // =========================
    const [[lowStock]] = await db.execute(`
      SELECT COUNT(*) AS total FROM (
        SELECT 
          p.id,
          p.min_stock,
          COUNT(CASE WHEN i.status = 'available' THEN 1 END) AS available_qty
        FROM products p
        LEFT JOIN inventory_items i ON i.product_id = p.id
        WHERE p.deleted_at IS NULL
        AND p.active = 1
        GROUP BY p.id, p.min_stock
        HAVING available_qty <= p.min_stock
      ) AS t
    `);

    // =========================
    // RESPONSE
    // =========================
    res.json({
      products: Number(products.total || 0),
      categories: Number(categories.total || 0),
      purchases: Number(purchases.total || 0),
      sales: Number(sales.total || 0),
      inventory,
      low_stock: Number(lowStock.total || 0),
    });

  } catch (err) {
    console.error("Dashboard Summary Error:", err);
    res.status(500).json({ error: err.message });
  }
};
export const getSalesTrends = async (req, res) => {
  try {
    const { type = 'day', startDate, endDate } = req.query;

    let where = `WHERE s.active = 1 AND s.deleted_at IS NULL`;
    const params = [];

    if (startDate) {
      where += ` AND s.created_at >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      where += ` AND s.created_at <= ?`;
      params.push(endDate);
    }

    const isMonthly = type === 'month';
    const periodFormat = isMonthly
      ? "DATE_FORMAT(s.created_at, '%Y-%m')"
      : "DATE(s.created_at)";

    const query = `
      SELECT 
        ${periodFormat} AS period,
        COUNT(DISTINCT s.id) AS total_sales,
        SUM(si.quantity) AS total_items_sold,
        GROUP_CONCAT(
          CONCAT(p.name, ' (', si.quantity, ')')
          ORDER BY si.quantity DESC SEPARATOR ', '
        ) AS products_list
      FROM sales s
      LEFT JOIN sale_items si ON si.sale_id = s.id
      LEFT JOIN products p ON p.id = si.product_id
      ${where}
      GROUP BY period
      ORDER BY period ASC
    `;

    const [rows] = await db.execute(query, params);

    const current = rows.map(r => ({
      period: r.period,
      total_sales: Number(r.total_sales || 0),
      total_items_sold: Number(r.total_items_sold || 0),
      products_sold: r.products_list
        ? r.products_list.split(', ').map(x => x)
        : []
    }));

    res.json({
      current,
      previous: [],
    });

  } catch (err) {
    console.error("Sales Trend Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * =========================
 * TOP SELLING PRODUCTS
 * =========================
 * By quantity only (NO revenue)
 */
export const getTopProducts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let where = `WHERE s.active = 1 AND s.deleted_at IS NULL`;
    const params = [];

    if (startDate) {
      where += ` AND s.created_at >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      where += ` AND s.created_at <= ?`;
      params.push(endDate);
    }

    const [rows] = await db.execute(`
      SELECT 
        p.id,
        p.name,
        p.barcode,
        SUM(si.quantity) AS total_quantity
      FROM sale_items si
      JOIN products p ON p.id = si.product_id
      JOIN sales s ON s.id = si.sale_id
      ${where}
      GROUP BY p.id, p.name, p.barcode
      ORDER BY total_quantity DESC
      LIMIT 10
    `, params);

    res.json(rows);

  } catch (err) {
    console.error("Top Products Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * =========================
 * RECENT ACTIVITY (DASHBOARD FEED)
 * =========================
 */
export const getRecentActivity = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        type,
        label,
        created_by_name,
        created_at
      FROM (

        -- SALES
        SELECT 
          'sale' COLLATE utf8mb4_unicode_ci AS type,
          CONCAT('New Sale: ', s.reference) COLLATE utf8mb4_unicode_ci AS label,
          NULL AS created_by_name,
          s.created_at
        FROM sales s
        WHERE s.active = 1 AND s.deleted_at IS NULL

        UNION ALL

        -- STOCK LOGS
        SELECT 
          'stock' COLLATE utf8mb4_unicode_ci AS type,
          CONCAT(sl.action_type, ': ', p.name) COLLATE utf8mb4_unicode_ci AS label,
          CAST(u.name AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS created_by_name,
          sl.created_at
        FROM stock_logs sl
        LEFT JOIN products p 
          ON p.id = sl.product_id
        LEFT JOIN users u 
          ON u.id = sl.created_by

      ) activity
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json(rows);
  } catch (err) {
    console.error("Recent Activity Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * =========================
 * STOCK VALUE REPORT
 * =========================
 */
export const getStockValueReport = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        p.id,
        p.name,
        p.barcode,
        c.name AS category,
        COUNT(CASE WHEN i.status = 'available' THEN 1 END) AS quantity_on_hand,
        p.cost_price,
        (COUNT(CASE WHEN i.status = 'available' THEN 1 END) * p.cost_price) AS stock_value
      FROM products p
      LEFT JOIN inventory_items i ON i.product_id = p.id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.deleted_at IS NULL AND p.active = 1
      GROUP BY p.id
      ORDER BY stock_value DESC
    `);

    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * =========================
 * TOTAL PRODUCTS (AVAILABLE ITEMS)
 * =========================
 */
export const getTotalProducts = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT COUNT(*) AS total_products
      FROM inventory_items
      WHERE status = 'available'
    `);

    res.json({ total_products: rows[0].total_products || 0 });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * =========================
 * TOTAL SOLD QUANTITY
 * =========================
 */
export const getTotalSalesSold = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT SUM(quantity) AS total_sold
      FROM sale_items
    `);

    res.json({ total_sold: rows[0].total_sold || 0 });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};