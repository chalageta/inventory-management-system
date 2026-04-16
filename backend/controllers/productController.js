// controllers/productController.js
import db from '../config/db.js';
/**
 * @desc    Get all products with search, category filter, low stock, and pagination
 * @route   GET /api/products
 * @access  Protected
 */
export const getAllProducts = async (req, res) => {
  try {
    const { search, category_id, status, page = 1, limit = 10 } = req.query;

    const params = [];
    const baseQuery = `
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u1 ON p.created_by = u1.id
      LEFT JOIN users u2 ON p.updated_by = u2.id
      WHERE p.deleted_at IS NULL
    `;

    let whereClause = ``;

    // =========================
    // SEARCH
    // =========================
    if (search) {
      whereClause += ` AND (p.name LIKE ? OR p.barcode LIKE ?)`;
      const val = `%${search}%`;
      params.push(val, val);
    }

    // =========================
    // CATEGORY FILTER
    // =========================
    if (category_id) {
      whereClause += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    // =========================
    // LOW STOCK FILTER
    // =========================
    if (status === 'low_stock') {
      whereClause += `
        AND (
          SELECT COUNT(*) 
          FROM inventory_items i 
          WHERE i.product_id = p.id 
            AND i.status = 'available' 
            AND i.deleted_at IS NULL
        ) <= p.min_stock
      `;
    }

    // =========================
    // COUNT QUERY (FIXED)
    // =========================
    const [countResult] = await db.execute(
      `SELECT COUNT(*) AS total ${baseQuery} ${whereClause}`,
      params
    );

    const total = countResult[0].total;

    // =========================
    // PAGINATION
    // =========================
    const offset = (page - 1) * limit;

    const finalQuery = `
      SELECT 
        p.id,
        p.name,
        p.barcode,
            p.uom,
        p.min_stock,
        p.image,
        p.active,
        p.description,
        p.created_at,
        p.updated_at,

        c.name AS category_name,
        u1.name AS creator_name,
        u2.name AS updater_name,

        (
          SELECT COUNT(*) 
          FROM inventory_items i 
          WHERE i.product_id = p.id 
            AND i.status = 'available' 
            AND i.deleted_at IS NULL
        ) AS quantity_available

      ${baseQuery}
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [products] = await db.execute(finalQuery, [
      ...params,
      parseInt(limit),
      offset
    ]);

    // =========================
    // REMOVE CREATED/UPDATED IDs (IMPORTANT FIX)
    // =========================
    const cleanedProducts = products.map(p => {
      const { created_by, updated_by, ...rest } = p;
      return rest;
    });

    // =========================
    // RESPONSE
    // =========================
    res.json({
      data: cleanedProducts,
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
 * @desc    Get single product by ID (with inventory details)
 * @route   GET /api/products/:id
 * @access  Protected
 */
export const getProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const [rows] = await db.execute(
      `
      SELECT 
        p.id,
        p.name,
        p.barcode,
        p.category_id,
        p.uom,
        p.min_stock,
        p.image,
        p.active,
        p.deleted_at,
        p.description,
        p.created_at,
        p.updated_at,
        c.name AS category_name,
        u1.name AS creator_name,
        u2.name AS updater_name,
        (
          SELECT COUNT(*) 
          FROM inventory_items i 
          WHERE i.product_id = p.id 
            AND i.status = 'available' 
            AND i.deleted_at IS NULL
        ) AS quantity_available
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u1 ON p.created_by = u1.id
      LEFT JOIN users u2 ON p.updated_by = u2.id
      WHERE p.id = ? AND p.deleted_at IS NULL
      `,
      [productId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = rows[0];

    // REMOVE unwanted fields BEFORE response
    delete product.created_by;
    delete product.updated_by;

    const [inventoryItems] = await db.execute(
      `
      SELECT id, serial_number, status
      FROM inventory_items
      WHERE product_id = ? AND deleted_at IS NULL
      `,
      [productId]
    );

    res.json({
      ...product,
      inventory_items: inventoryItems
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Admin/Manager
 */
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      barcode,
      category_id,
      uom = 'Unit',
      min_stock = 0,
      image = null,
      description = null
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Product name is required" });
    }

    const userId = req.user?.id || 1;

    // =========================
    // CHECK DUPLICATE NAME
    // =========================
    const [checkName] = await db.execute(
      `SELECT id FROM products WHERE name = ? AND deleted_at IS NULL`,
      [name]
    );

    if (checkName.length > 0) {
      return res.status(400).json({ error: "Product name already exists." });
    }

    // =========================
    // CHECK DUPLICATE BARCODE
    // =========================
    if (barcode) {
      const [checkBarcode] = await db.execute(
        `SELECT id FROM products WHERE barcode = ? AND deleted_at IS NULL`,
        [barcode]
      );

      if (checkBarcode.length > 0) {
        return res.status(400).json({ error: "Barcode already exists" });
      }
    }

    // =========================
    // INSERT PRODUCT (FIXED)
    // =========================
    const [result] = await db.execute(
      `INSERT INTO products
       (name, barcode, category_id, uom, min_stock, image, description, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?,  ?)`,
      [
        name,
        barcode || null,
        category_id || null,
        uom,
        min_stock,
        image,
        description,
        userId,
        userId
      ]
    );

    return res.status(201).json({
      message: "Product created successfully",
      id: result.insertId
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user?.id || 1;

    // =========================
    // ONLY ALLOWED FIELDS
    // =========================
    const {
      name,
      barcode,
      category_id,
      uom,
      min_stock,
      image,
      description
    } = req.body;

    // =========================
    // BUILD SAFE UPDATE OBJECT
    // =========================
    const safeUpdates = {};

    if (name !== undefined) safeUpdates.name = name;
    if (barcode !== undefined) safeUpdates.barcode = barcode;
    if (category_id !== undefined) safeUpdates.category_id = category_id;
    if (uom !== undefined) safeUpdates.uom = uom;
    if (min_stock !== undefined) safeUpdates.min_stock = min_stock;
    if (image !== undefined) safeUpdates.image = image;
    if (description !== undefined) safeUpdates.description = description;

    // always update this from backend
    safeUpdates.updated_by = userId;

    // =========================
    // VALIDATION
    // =========================
    if (Object.keys(safeUpdates).length === 1) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    // =========================
    // BUILD QUERY
    // =========================
    const fields = Object.keys(safeUpdates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = [...fields.map(field => safeUpdates[field]), productId];

    const [result] = await db.execute(
      `UPDATE products
       SET ${setClause}
       WHERE id = ? AND deleted_at IS NULL`,
      values
    );

    // =========================
    // NOT FOUND CHECK
    // =========================
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json({
      message: "Product updated successfully"
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
export const archiveProduct = async (req, res) => {
  try {
    const userId = req.user?.id;
    const productId = req.params.id;

    // 1. Check inventory existence
    const [inv] = await db.execute(
      `SELECT COUNT(*) AS count FROM inventory_items WHERE product_id = ? AND deleted_at IS NULL`,
      [productId]
    );

    if (inv[0].count > 0) {
      return res.status(400).json({
        error: "Product has inventory. It will be archived instead of deleted."
      });
    }

    // 2. Soft delete product
    await db.execute(
      `UPDATE products 
       SET active = FALSE, deleted_at = NOW(), updated_by = ?
       WHERE id = ?`,
      [userId, productId]
    );

    res.json({ message: "Product archived successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};