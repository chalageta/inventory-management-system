import express from 'express';
import {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect(['Admin', 'Manager']), createCategory);
router.get('/', getAllCategories);
router.get('/:id', getCategory);
router.put('/:id', protect(['Admin', 'Manager']), updateCategory);
router.delete('/:id', protect(['Admin', 'Manager']), deleteCategory);

export default router;