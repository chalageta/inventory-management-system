import express from 'express';

import {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  archiveProduct,
  uploadProductsExcel

} from '../controllers/productController.js';
import multer from 'multer';
import { protect, checkPermission } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

const excelUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Accept Excel mimetypes only
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed!'), false);
    }
  }
});
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

router.post(
  '/upload-excel',
  protect(),
  checkPermission('create_product'),
  excelUpload.single('file'), // This specifically allows Excel files
  uploadProductsExcel
);
export default router;