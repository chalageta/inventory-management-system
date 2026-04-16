import db from '../config/db.js';

/**
 * Helper to handle date filtering
 */
const getDateFilters = (startDate, endDate, tableAlias = 's') => {
  let conditions = '';
  const params = [];
  if (startDate) {
    conditions += ` AND ${tableAlias}.created_at >= ?`;
    params.push(`${startDate} 00:00:00`);
  }
  if (endDate) {
    conditions += ` AND ${tableAlias}.created_at <= ?`;
    params.push(`${endDate} 23:59:59`);
  }
  return { conditions, params };
};

/**
 * Dashboard Summary Cards
 */export const getStatsSummary = async (req, res) => {
  try {
    const [todaySales] = await db.execute(`
      SELECT SUM(total_amount + tax_amount) AS total 
      FROM sales 
      WHERE DATE(created_at) = CURDATE() 
      AND active = 1 AND deleted_at IS NULL
    `);

    const [totalProducts] = await db.execute(`
      SELECT COUNT(*) AS total FROM products 
      WHERE deleted_at IS NULL AND active = 1
    `);

    const [availableItems] = await db.execute(`
      SELECT COUNT(*) AS total 
      FROM inventory_items 
      WHERE status = 'available' AND deleted_at IS NULL AND active = 1
    `);

    const [soldItems] = await db.execute(`
      SELECT COUNT(*) AS total 
      FROM inventory_items 
      WHERE status = 'sold' AND deleted_at IS NULL AND active = 1
    `);

    const [draftSales] = await db.execute(`
      SELECT COUNT(*) AS count FROM sales 
      WHERE status = 'Draft' AND active = 1 AND deleted_at IS NULL
    `);

    // ✅ FIXED LOW STOCK
    const [lowStockItems] = await db.execute(`
      SELECT *
      FROM (
        SELECT 
          p.id,
          p.min_stock,
          COUNT(CASE WHEN i.status = 'available' THEN 1 END) AS available_qty
        FROM products p
        LEFT JOIN inventory_items i ON p.id = i.product_id
        WHERE p.deleted_at IS NULL AND p.active = 1
        GROUP BY p.id, p.min_stock
      ) AS stock_table
      WHERE available_qty <= min_stock
    `);

    res.json({
      today_revenue: todaySales[0].total || 0,
      total_products: totalProducts[0].total || 0,
      total_available: availableItems[0].total || 0,
      total_sold: soldItems[0].total || 0,
      pending_orders: draftSales[0].count || 0,
      low_stock_count: lowStockItems.length
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Sales Chart Data (Daily or Monthly)
 */
export const getSalesTrends = async (req, res) => {
  try {
    const { type, start_date, end_date } = req.query;
    const { conditions, params } = getDateFilters(start_date, end_date, 'sales');

    let query = '';
    if (type === 'month' || type === 'monthly-sales') {
      query = `
                SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
                       COUNT(id) as sale_count,
                       SUM(total_amount + tax_amount) AS total
                FROM sales WHERE active = 1 AND deleted_at IS NULL ${conditions}
                GROUP BY month ORDER BY month ASC
            `;
    } else {
      query = `
                SELECT DATE(created_at) AS date,
                       COUNT(id) as sale_count,
                       SUM(total_amount + tax_amount) AS total
                FROM sales WHERE active = 1 AND deleted_at IS NULL ${conditions}
                GROUP BY date ORDER BY date ASC LIMIT 30
            `;
    }

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Top 10 Selling Products
 */
export const getTopProducts = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const { conditions, params } = getDateFilters(start_date, end_date, 's');

    const [rows] = await db.execute(`
            SELECT p.name, p.barcode, 
                   SUM(si.quantity) AS total_quantity,
                   SUM(si.quantity * si.unit_price) AS total_revenue
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            JOIN sales s ON si.sale_id = s.id
            WHERE s.active = 1 AND s.deleted_at IS NULL ${conditions}
            GROUP BY p.id, p.name, p.barcode
            ORDER BY total_quantity DESC
            LIMIT 10
        `, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getRecentActivity = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      (SELECT 
          'sale' COLLATE utf8mb4_unicode_ci AS type, 
          CONCAT('Sale: ', s.reference) COLLATE utf8mb4_unicode_ci AS label, 
          CAST((s.total_amount + s.tax_amount) AS CHAR) COLLATE utf8mb4_unicode_ci AS value, 
          s.created_at 
       FROM sales s 
       WHERE s.active = 1 AND s.deleted_at IS NULL)
      
      UNION ALL
      
      (SELECT 
          'stock' COLLATE utf8mb4_unicode_ci AS type, 
          CONCAT(sl.action_type, ': ', p.name) COLLATE utf8mb4_unicode_ci AS label, 
          CAST(i.serial_number AS CHAR) COLLATE utf8mb4_unicode_ci AS value, 
          sl.created_at 
       FROM stock_logs sl
       JOIN products p ON sl.product_id = p.id
       JOIN inventory_items i ON sl.inventory_item_id = i.id)
      
      ORDER BY created_at DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    console.error("Collation Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getStockValueReport = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        p.id, 
        p.name, 
        p.barcode, 
        c.name as category, 
        COUNT(CASE WHEN i.status = 'available' THEN 1 END) as quantity_on_hand, 
        p.cost_price,
        (COUNT(CASE WHEN i.status = 'available' THEN 1 END) * p.cost_price) AS stock_value
      FROM products p
      LEFT JOIN inventory_items i ON p.id = i.product_id
      LEFT JOIN categories c ON p.category_id = c.id
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
 * Tax Collection Report
 */
export const getTaxReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const { conditions, params } = getDateFilters(start_date, end_date, 'sales');

    const [rows] = await db.execute(`
            SELECT DATE(created_at) AS date, 
                   SUM(tax_amount) AS tax_collected,
                   SUM(total_amount + tax_amount) AS sales_total
            FROM sales
            WHERE active = 1 AND deleted_at IS NULL ${conditions}
            GROUP BY date
            ORDER BY date DESC
        `, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Total products available
export const getTotalProducts = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT COUNT(*) AS total_products 
      FROM inventory_items 
      WHERE status = 'available' AND active = 1
    `);
    res.json({ total_products: rows[0].total_products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Total quantity of products sold
export const getTotalSalesSold = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT SUM(quantity) AS total_sold 
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.active = 1 AND s.deleted_at IS NULL
    `);
    res.json({ total_sold: rows[0].total_sold || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}