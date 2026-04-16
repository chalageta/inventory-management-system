import express from 'express';
import {
  createSale,
  getAllSales,
  getSale,
  archiveSale,
  getSaleReceipt,
  approveSale,
  rejectSale,
  completeSale
} from '../controllers/saleController.js';

import { protect, checkPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

// CREATE (Salesman)
router.post(
  '/',
  protect(),
  checkPermission('create_sale'),
  createSale
);

// LIST
router.get(
  '/',
  protect(),
  checkPermission('view_sales'),
  getAllSales
);

// SINGLE
router.get(
  '/:id',
  protect(),
  checkPermission('view_sales'),
  getSale
);

// RECEIPT
router.get(
  '/:id/receipt',
  protect(),
  checkPermission('view_sales'),
  getSaleReceipt
);

// FINANCE APPROVAL
router.put(
  '/:id/approve',
  protect(),
  checkPermission('approve_sale'),
  approveSale
);

// REJECT
router.put(
  '/:id/reject',
  protect(),
  checkPermission('reject_sale'),
  rejectSale
);

// STORE FINAL STEP
router.put(
  '/:id/complete',
  protect(),
  checkPermission('complete_sale'),
  completeSale
);

// ARCHIVE
router.delete(
  '/:id',
  protect(),
  checkPermission('delete_sale'),
  archiveSale
);

export default router;