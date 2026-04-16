import express from 'express';

import {
  getRoles,
  getPermissions,
  assignRoleToUser,
  assignRolesToUser,
  getUserRoles,
  getUserPermissions,
  assignPermissionsToRole,
  getRolePermissions,
  createRole,
  updateRole,
  deleteRole,

  // ✅ ADD THESE (IMPORTANT IF NOT IMPORTED BEFORE)
  createPermission,
  deletePermission
} from '../controllers/rbacController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * 🔐 GLOBAL PROTECTION (Admin only access)
 */
router.use(protect(['Admin']));

/* =========================
   📌 ROLE ROUTES
========================= */
router.get('/roles', getRoles);
router.post('/roles', createRole);
router.put('/roles/:id', updateRole);
router.delete('/roles/:id', deleteRole);

/* =========================
   📌 PERMISSION ROUTES
========================= */
router.get('/permissions', getPermissions);
router.post('/permissions', createPermission);   // ✅ ADDED
router.delete('/permissions/:id', deletePermission); // ✅ ADDED

/* =========================
   📌 ROLE ↔ PERMISSION
========================= */
router.post('/assign-permissions', assignPermissionsToRole);
router.get('/role-permissions/:roleId', getRolePermissions);

/* =========================
   📌 USER ↔ ROLE
========================= */
router.post('/assign-role', assignRoleToUser);
router.post('/assign-roles', assignRolesToUser);
router.get('/user-roles/:userId', getUserRoles);

/* =========================
   📌 USER ↔ PERMISSION (RESOLVED VIA ROLES)
========================= */
router.get('/user-permissions/:userId', getUserPermissions);

export default router;