import express from 'express';
import {
  createPurchase,
  approvePurchase,
  receivePurchase,
  getPurchases,
  getPurchaseDetail,  
  updatePurchase,
  deletePurchase,
  rejectPurchase
} from '../controllers/purchaseController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * =========================
 * PURCHASE CRUD (PROTECTED)
 * =========================
 */
router.post(
  '/',
  protect(),
  checkPermission('manage_purchases'),
  createPurchase
);

router.get(
  '/',
  protect(),
  checkPermission('manage_purchases'),
  getPurchases
);

router.get(
  '/:id',
  protect(),
  checkPermission('manage_purchases'),
  getPurchaseDetail
);
router.put(
  '/:id',
  protect(),
  checkPermission('manage_purchases'),
  updatePurchase
);

router.delete(
  '/:id',
  protect(),
  checkPermission('manage_purchases'),
  deletePurchase
);

/**
 * =========================
 * WORKFLOW ACTIONS
 * =========================
 */
router.put(
  '/:id/approve',
  protect(),
  checkPermission('approve_purchase'),
  approvePurchase
);

router.put(
  '/:id/receive',
  protect(),
  checkPermission('receive_purchase'),
  receivePurchase
);

router.put(
  '/:id/reject',
  protect(),
  checkPermission('reject_purchase'),
  rejectPurchase
);

export default router;