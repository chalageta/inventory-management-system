import db from '../config/db.js';

export const checkPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userId = req.user.id;
      const permsArray = Array.isArray(permissions) ? permissions : [permissions];

      // Create placeholders (?, ?, ?)
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

      if (!rows.length) {
        return res.status(403).json({ error: "Permission denied" });
      }

      next();
    } catch (err) {
      console.error("Permission Error:", err);
      res.status(500).json({ error: "Server error" });
    }
  };
};