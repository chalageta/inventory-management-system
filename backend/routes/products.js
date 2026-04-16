
import express from 'express';
const router = express.Router();

import { protect } from '../middleware/authMiddleware.js';
import * as productController from '../controllers/productController.js';


router.get('/', protect(), productController.getAllProducts);
router.get('/:id', protect(), productController.getProduct);

router.post('/', protect(['Admin', 'Manager']), productController.createProduct);
router.put('/:id', protect(['Admin', 'Manager']), productController.updateProduct);
router.delete('/:id', protect(['Admin', 'Manager']), productController.archiveProduct);
export default router;