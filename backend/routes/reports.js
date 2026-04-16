import express from 'express';
import {
  getStatsSummary,
  getSalesTrends,
  getTopProducts,
  getRecentActivity,
  getStockValueReport,
  getTotalProducts,
  getTotalSalesSold
} from '../controllers/reportsController.js';

import { protect, checkPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * =========================
 * DASHBOARD KPI
 * =========================
 */
router.get(
  '/dashboard',
  protect(),
  checkPermission('view_inventory'),
  getStatsSummary
);

/**
 * =========================
 * ANALYTICS (FINANCE)
 * =========================
 */
router.get(
  '/sales-trends',
  protect(),
  checkPermission('view_finance'),
  getSalesTrends
);

router.get(
  '/top-products',
  protect(),
  checkPermission('view_finance'),
  getTopProducts
);

router.get(
  '/stock-value',
  protect(),
  checkPermission('view_finance'),
  getStockValueReport
);

/**
 * =========================
 * ACTIVITY FEED
 * =========================
 */
router.get(
  '/recent-activity',
  protect(),
  checkPermission('view_inventory'),
  getRecentActivity
);

/**
 * =========================
 * SIMPLE METRICS
 * =========================
 */
router.get(
  '/total-products',
  protect(),
  checkPermission('view_inventory'),
  getTotalProducts
);

router.get(
  '/total-sold',
  protect(),
  checkPermission('view_sales'),
  getTotalSalesSold
);

export default router;