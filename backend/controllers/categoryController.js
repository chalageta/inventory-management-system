import db from '../config/db.js';

/**
 * @desc    Get all categories (with Search & Pagination)
 * @route   GET /api/categories
 */
export const getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    // Build query with search
    let query = `FROM categories WHERE active = 1`;
    let params = [];

    if (search) {
      query += ` AND (name LIKE ? OR description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count for pagination
    const [countRows] = await db.execute(`SELECT COUNT(*) as total ${query}`, params);
    const total = countRows[0].total;

    // Get paginated data
    const [categories] = await db.execute(
      `SELECT id, name, description, active as is_active, created_at, updated_at 
       ${query} ORDER BY name LIMIT ? OFFSET ?`,
      [...params, limit.toString(), offset.toString()]
    );

    res.json({
      data: categories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Create a new category
 */
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });

    const [check] = await db.execute(`SELECT id FROM categories WHERE name = ? AND active = 1`, [name]);
    if (check.length > 0) return res.status(400).json({ error: 'Category already exists' });

    const [result] = await db.execute(
      `INSERT INTO categories (name, description) VALUES (?, ?)`,
      [name, description || null]
    );

    res.status(201).json({ message: 'Category created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Get single category
 * @route   GET /api/categories/:id
 * @access  Public
 */
export const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(
      `SELECT id, name, description, active, created_at, updated_at 
       FROM categories WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Admin/Manager
 */
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, active } = req.body;

    const [rows] = await db.execute(`SELECT id FROM categories WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Category not found' });

    await db.execute(
      `UPDATE categories SET name = ?, description = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, description || null, active ?? 1, id]
    );

    res.json({ message: 'Category updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Delete category (soft delete)
 * @route   DELETE /api/categories/:id
 * @access  Admin/Manager
 */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(`SELECT id FROM categories WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Category not found' });

    await db.execute(`UPDATE categories SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);

    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};