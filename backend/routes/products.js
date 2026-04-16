import express from 'express';

import {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  archiveProduct
} from '../controllers/productController.js';

import { protect, checkPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * =========================
 * PRODUCT ROUTES
 * =========================
 */

/**
 * GET ALL PRODUCTS
 */
router.get(
  '/',
  protect(),
  checkPermission('view_products'),
  getAllProducts
);

/**
 * GET SINGLE PRODUCT
 */
router.get(
  '/:id',
  protect(),
  checkPermission('view_products'),
  getProduct
);

/**
 * CREATE PRODUCT
 */
router.post(
  '/',
  protect(),
  checkPermission('create_product'),
  createProduct
);

/**
 * UPDATE PRODUCT
 */
router.put(
  '/:id',
  protect(),
  checkPermission('update_product'),
  updateProduct
);

/**
 * DELETE / ARCHIVE PRODUCT
 */
router.delete(
  '/:id',
  protect(),
  checkPermission('delete_product'),
  archiveProduct
);

export default router;