import db from '../config/db.js';

// =======================
// GET USER ROLES
// =======================
export const getUserRoles = async (userId) => {
  const [rows] = await db.execute(
    `SELECT r.name
     FROM roles r
     JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = ?`,
    [userId]
  );

  return rows.map(r => r.name);
};

// =======================
// GET USER PERMISSIONS
// =======================
export const getUserPermissions = async (userId) => {
  const [rows] = await db.execute(
    `SELECT DISTINCT p.name
     FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     JOIN user_roles ur ON ur.role_id = rp.role_id
     WHERE ur.user_id = ?`,
    [userId]
  );

  return rows.map(p => p.name);
};

// =======================
// CHECK PERMISSION
// =======================
export const hasPermission = async (userId, permission) => {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
};