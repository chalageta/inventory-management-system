import db from '../config/db.js';
export const createRole = async (req, res) => {
  const { name } = req.body;

  try {
    const [result] = await db.execute(
      `INSERT INTO roles (name) VALUES (?)`,
      [name]
    );

    res.json({
      message: "Role created successfully",
      roleId: result.insertId // ✅ IMPORTANT FIX
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};export const updateRole = async (req, res) => {
  const { name } = req.body;

  try {
    await db.execute(
      `UPDATE roles SET name=? WHERE id=?`,
      [name, req.params.id]
    );

    res.json({ message: "Role updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const deleteRole = async (req, res) => {
  try {
    // remove mappings first
    await db.execute(`DELETE FROM role_permissions WHERE role_id=?`, [req.params.id]);
    await db.execute(`DELETE FROM user_roles WHERE role_id=?`, [req.params.id]);

    await db.execute(`DELETE FROM roles WHERE id=?`, [req.params.id]);

    res.json({ message: "Role deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// =======================
// 📌 GET ALL ROLES
// =======================
export const getRoles = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const offset = (page - 1) * limit;

    // 🔍 SEARCH CONDITION
    const searchQuery = `%${search}%`;

    // 📊 GET DATA
    const [roles] = await db.execute(
      `
      SELECT * 
      FROM roles 
      WHERE name LIKE ?
      ORDER BY name
      LIMIT ? OFFSET ?
      `,
      [searchQuery, Number(limit), Number(offset)]
    );

    // 📊 COUNT TOTAL
    const [countResult] = await db.execute(
      `
      SELECT COUNT(*) as total 
      FROM roles 
      WHERE name LIKE ?
      `,
      [searchQuery]
    );

    const total = countResult[0].total;

    res.json({
      data: roles,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const createPermission = async (req, res) => {
  const { name, module } = req.body;

  try {
    if (!name || !module) {
      return res.status(400).json({ error: "Name and module required" });
    }

    await db.execute(
      `INSERT INTO permissions (name, module)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE name = name`, // 🔥 DO NOTHING if exists
      [name, module]
    );

    res.json({ message: "Permission ensured (created if not exists)" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePermission = async (req, res) => {
  try {
    const id = req.params.id;

    // remove mapping first
    await db.execute(`DELETE FROM role_permissions WHERE permission_id = ?`, [id]);

    await db.execute(`DELETE FROM permissions WHERE id = ?`, [id]);

    res.json({ message: "Permission deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// =======================
// 📌 GET ALL PERMISSIONS
// =======================
export const getPermissions = async (req, res) => {
  try {
    const [permissions] = await db.execute(
      `SELECT * FROM permissions ORDER BY module, name`
    );

    // group by module
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
    }, {});

    res.json({
      flat: permissions,
      grouped
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// =======================
// 📌 ASSIGN SINGLE ROLE
// =======================
export const assignRoleToUser = async (req, res) => {
  const { userId, roleId } = req.body;

  try {
    await db.execute(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE role_id = VALUES(role_id)`,
      [userId, roleId]
    );

    res.json({ message: "Role assigned successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =======================
// 📌 ASSIGN MULTIPLE ROLES
// Body: { userId: 1, roleIds: [1,2,3] }
// =======================
export const assignRolesToUser = async (req, res) => {
  const { userId, roleIds } = req.body;

  try {
    // remove old roles
    await db.execute(`DELETE FROM user_roles WHERE user_id = ?`, [userId]);

    // insert new roles
    for (const roleId of roleIds) {
      await db.execute(
        `INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`,
        [userId, roleId]
      );
    }

    res.json({ message: "Roles updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =======================
// 📌 GET USER ROLES
// =======================
export const getUserRoles = async (req, res) => {
  try {
    const userId = req.params.userId;

    const [roles] = await db.execute(
      `SELECT r.id, r.name
       FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = ?`,
      [userId]
    );

    res.json({ userId, roles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =======================
// 📌 GET USER PERMISSIONS
// =======================
export const getUserPermissions = async (req, res) => {
  try {
    const userId = req.params.userId;

    const [permissions] = await db.execute(
      `SELECT DISTINCT p.name, p.module
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = ?`,
      [userId]
    );

    res.json({
      userId,
      permissions: permissions.map(p => p.name),
      full: permissions
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =======================
// 📌 ASSIGN PERMISSIONS TO ROLE
// Body: { roleId: 1, permissionIds: [1,2,3] }
// =======================
export const assignPermissionsToRole = async (req, res) => {
  const { roleId, permissionIds } = req.body;

  if (!roleId || !Array.isArray(permissionIds)) {
    return res.status(400).json({ error: "Invalid roleId or permissionIds" });
  }

  try {
    // 1. Delete existing permissions
    await db.execute(`DELETE FROM role_permissions WHERE role_id = ?`, [roleId]);

    // 2. Bulk insert new permissions if any
    if (permissionIds.length > 0) {
      // We use db.query for bulk inserts with nested arrays [[]]
      const values = permissionIds.map(pId => [roleId, pId]);
      await db.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ?`,
        [values]
      );
    }

    res.json({ message: "Permissions updated successfully" });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// =======================
// 📌 GET ROLE PERMISSIONS
// =======================
export const getRolePermissions = async (req, res) => {
  try {
    const roleId = req.params.roleId;

    const [permissions] = await db.execute(
      `SELECT p.id, p.name, p.module
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      [roleId]
    );

    res.json({ roleId, permissions });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};