import express from 'express';
import {
  getStatsSummary,
  getSalesTrends,
  getTopProducts,
  getStockValueReport,
  getTaxReport,
  getRecentActivity,
  getTotalProducts,
  getTotalSalesSold
} from '../controllers/reportsController.js';

// ✅ Import both protect and checkPermission
import { protect, checkPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * 📊 ANALYTICS & REPORTS
 * All routes require authentication first.
 */
router.use(protect()); 

// 1. General Dashboard Metrics (Requires view_inventory or view_sales)
// Using an array allows users with either permission to see basic stats
router.get('/summary', checkPermission(['view_inventory', 'view_sales']), getStatsSummary);
router.get('/recent', checkPermission(['view_inventory', 'view_sales']), getRecentActivity);

// 2. Inventory Specific Reports
router.get('/stock-value', checkPermission('view_inventory'), getStockValueReport);
router.get('/total-products', checkPermission('view_inventory'), getTotalProducts);

// 3. Financial & Sales Specific Reports
router.get('/trends', checkPermission('view_finance'), getSalesTrends);
router.get('/top-products', checkPermission('view_finance'), getTopProducts);
router.get('/tax', checkPermission('view_finance'), getTaxReport);
router.get('/total-sales', checkPermission('view_finance'), getTotalSalesSold);

export default router;