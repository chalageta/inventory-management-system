import db from '../config/db.js';
import { sendLowStockEmail } from './emailService.js';

export const checkLowStockAndNotify = async () => {
  try {
    // =========================
    // 1. GET LOW STOCK PRODUCTS
    // =========================
    const [rows] = await db.execute(`
      SELECT 
        p.id,
        p.name,
        p.min_stock,
        COUNT(i.id) AS quantity_available
      FROM products p
      LEFT JOIN inventory_items i 
        ON i.product_id = p.id
        AND i.status = 'available'
        AND i.deleted_at IS NULL
      WHERE p.deleted_at IS NULL
        AND p.active = 1
      GROUP BY p.id
      HAVING quantity_available <= p.min_stock
    `);

    if (!rows.length) return;

    const newAlerts = [];

    // =========================
    // 2. PROCESS EACH PRODUCT
    // =========================
    for (const product of rows) {

      // prevent duplicate alerts
      const [exists] = await db.execute(`
        SELECT id FROM notifications
        WHERE product_id = ?
          AND type = 'LOW_STOCK'
          AND is_read = 0
      `, [product.id]);

      if (!exists.length) {

        // =========================
        // INSERT NOTIFICATION (DB)
        // =========================
        await db.execute(`
          INSERT INTO notifications (type, message, product_id)
          VALUES ('LOW_STOCK', ?, ?)
        `, [
          `${product.name} is low (${product.quantity_available} left)`,
          product.id
        ]);

        // collect for email
        newAlerts.push(product);
      }
    }

    // =========================
    // 3. SEND EMAIL TO ADMIN
    // =========================
    if (newAlerts.length > 0) {
      await sendLowStockEmail(newAlerts);
    }

  } catch (err) {
    console.error("Low stock check error:", err);
  }
};