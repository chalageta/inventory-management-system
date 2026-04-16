import jwt from 'jsonwebtoken';
import db from '../config/db.js';

/**
 * 🛡️ AUTHENTICATION & ROLE PROTECTION
 * Verifies the JWT token and optionally checks if the user has the required Role.
 * Usage: 
 * - protect()             -> Any logged-in user
 * - protect(['Admin'])    -> Only Admins
 */
export const protect = (roles = []) => async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // 1. Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Fetch User + Primary Role from DB
    // We join with the roles table to get the current role name
    const [rows] = await db.execute(
      `SELECT u.id, u.name, u.email, r.name as role 
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = ? AND u.deleted_at IS NULL`,
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'User not found or account deleted' });
    }

    const user = rows[0];
    req.user = user; // Attach user to request object

    // 3. Role Check (Optional)
    if (roles.length > 0) {
      const allowedRoles = roles.map(r => r.toLowerCase());
      const userRole = user.role ? user.role.toLowerCase() : '';

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ error: 'Access denied: Insufficient role' });
      }
    }

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * 🔑 GRANULAR PERMISSION CHECK
 * Checks if the authenticated user has specific permissions via their role.
 * Usage: 
 * - checkPermission('view_finance')
 * - checkPermission(['create_product', 'update_product'])
 */
export const checkPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      // Must be used after protect()
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized: User context missing" });
      }

      const userId = req.user.id;
      const permsArray = Array.isArray(permissions) ? permissions : [permissions];

      // Create placeholders (?, ?, ?) for the SQL IN clause
      const placeholders = permsArray.map(() => '?').join(',');

      const [rows] = await db.execute(
        `
        SELECT DISTINCT p.name
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = ? AND p.name IN (${placeholders})
        `,
        [userId, ...permsArray]
      );

      // If the user has none of the required permissions
      if (!rows.length) {
        return res.status(403).json({ 
          error: "Permission denied", 
          required: permsArray 
        });
      }

      next();
    } catch (err) {
      console.error("Permission Middleware Error:", err);
      res.status(500).json({ error: "Internal server error during permission check" });
    }
  };
};