// controllers/productController.js
import db from '../config/db.js';
import xlsx from 'xlsx';
/**
 * @desc    Get all products with search, category filter, low stock, and pagination
 * @route   GET /api/products
 * @access  Protected
 */
export const getAllProducts = async (req, res) => {
  try {
    const {
      search,
      category_id,
      status,
      page = 1,
      limit = 10
    } = req.query;

    const params = [];

    let baseQuery = `
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u1 ON p.created_by = u1.id
      LEFT JOIN users u2 ON p.updated_by = u2.id
      WHERE p.deleted_at IS NULL
    `;

    let whereClause = ``;

    // =========================
    // SEARCH (ALL FIELDS)
    // =========================
    if (search) {
      whereClause += `
        AND (
          p.name LIKE ?
          OR p.barcode LIKE ?
          OR p.manufacturer LIKE ?
          OR p.model LIKE ?
          OR p.description LIKE ?
          OR c.name LIKE ?
        )
      `;

      const val = `%${search}%`;
      params.push(val, val, val, val, val, val);
    }

    // =========================
    // CATEGORY FILTER (SINGLE OR MULTIPLE)
    // =========================
    if (category_id) {
      const ids = category_id.split(",").map(id => id.trim());

      if (ids.length === 1) {
        whereClause += ` AND p.category_id = ?`;
        params.push(ids[0]);
      } else {
        whereClause += ` AND p.category_id IN (${ids.map(() => "?").join(",")})`;
        params.push(...ids);
      }
    }

    // =========================
    // LOW STOCK FILTER
    // =========================
    if (status === "low_stock") {
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
    // COUNT QUERY
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
        p.manufacturer,
        p.model,
        p.barcode,
        p.uom,
        p.min_stock,
        p.image,
        p.active,
        p.description,
        p.created_at,
        p.updated_at,

        c.id AS category_id,
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
    // CLEAN RESPONSE
    // =========================
    const cleanedProducts = products.map((p) => {
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
    p.manufacturer,   
    p.model,         
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
   (name, manufacturer, model, barcode, category_id, uom, min_stock, image, description, created_by, updated_by)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    name,
    manufacturer || null,
    model || null,
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
      manufacturer,
      model,
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
    if (manufacturer !== undefined) safeUpdates.manufacturer = manufacturer;
    if (model !== undefined) safeUpdates.model = model;
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
export const uploadProductsExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Excel file is required" });
    }

    const userId = req.user?.id || 1;
    const categoryId = 2;

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    let insertedProducts = 0;
    let insertedPurchases = 0;
    let skipped = 0;

    await db.beginTransaction();

    // =========================
    // CLEAN NUMBER
    // =========================
    const cleanNumber = (value) => {
      if (!value) return null;
      if (typeof value === "number") return value;

      const cleaned = String(value).replace(/,/g, "").trim();
      const num = Number(cleaned);
      return isNaN(num) ? null : num;
    };

    // =========================
    // NORMALIZE KEYS
    // =========================
    const normalizeRow = (row) => {
      const newRow = {};
      Object.keys(row).forEach((key) => {
        newRow[key.trim()] = row[key];
      });
      return newRow;
    };

    for (const rawRow of data) {
      const row = normalizeRow(rawRow);
const parseExcelDate = (value) => {
  if (!value) return null;

  // If Excel gives a number (serial date)
  if (typeof value === "number") {
    const excelStart = new Date(1899, 11, 30);
    const date = new Date(excelStart.getTime() + value * 86400000);
    return date.toISOString().split("T")[0];
  }

  // If string like "3/27/2026"
  if (typeof value === "string") {
    const parts = value.split("/");
    if (parts.length === 3) {
      const [month, day, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }

  return null;
};
      const name = row["Item Name"]?.trim();
      if (!name) continue;

      const manufacturer = row["Manufacturer"] || null;

      // 🔥 FIX: normalize model (avoid NULL duplicates)
      const modelRaw = row["Model"];
      const model =
        modelRaw && modelRaw.trim() !== ""
          ? modelRaw.trim()
          : "NO_MODEL";

      const serialNumber = row["Serial number"]?.toString().trim() || null;
      const lotNumber = row["Lot number"]?.toString().trim() || null;
      const location = row["Location"] || null;
      // ✅ Expiry Date
      const expiryDate = parseExcelDate(row["Expiry date"]);
      const quantity =
        parseInt(String(row["Quantity"]).replace(/\s/g, "")) || 1;

      const unitCost = cleanNumber(row["Unit Cost"]);

      const totalCost =
        cleanNumber(row["Total Cost"]) ??
        (unitCost && quantity ? unitCost * quantity : null);

      const description = row["Description"] || null;

      let productId;

      // =========================
      // CHECK / CREATE PRODUCT
      // =========================
      const [existProduct] = await db.execute(
        `SELECT id FROM products 
         WHERE name = ? AND model = ? AND deleted_at IS NULL`,
        [name, model]
      );

      if (existProduct.length) {
        productId = existProduct[0].id;
      } else {
        const [result] = await db.execute(
          `INSERT INTO products
          (name, manufacturer, model, category_id, uom, min_stock, description, created_by, updated_by)
          VALUES (?, ?, ?, ?, 'Unit', 3, ?, ?, ?)`,
          [
            name,
            manufacturer,
            model,
            categoryId,
            description,
            userId,
            userId,
          ]
        );

        productId = result.insertId;
        insertedProducts++;
      }

      // =========================
      // DUPLICATE CONTROL 🔥
      // =========================

      // 👉 Equipment → use serial
      if (serialNumber) {
        const [existSerial] = await db.execute(
          `SELECT id FROM purchases WHERE serial_number = ?`,
          [serialNumber]
        );

        if (existSerial.length) {
          skipped++;
          continue;
        }
      }

      // 👉 Reagents → use lot
      if (lotNumber) {
        const [existLot] = await db.execute(
          `SELECT id FROM purchases 
           WHERE product_id = ? AND lot_number = ?`,
          [productId, lotNumber]
        );

        if (existLot.length) {
          skipped++;
          continue;
        }
      }

      // =========================
      // INSERT PURCHASE
      // =========================
      await db.execute(
        `INSERT INTO purchases
        (product_id, serial_number, lot_number, expiry_date, total_items, location, unit_cost, total_cost, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productId,
          serialNumber,
          lotNumber,
          expiryDate,
          quantity,
          location,
          unitCost,
          totalCost,
          userId,
        ]
      );

      insertedPurchases++;
    }

    await db.commit();

    res.json({
      message: "Excel uploaded successfully",
      insertedProducts,
      insertedPurchases,
      skippedDuplicates: skipped,
    });

  } catch (err) {
    await db.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};