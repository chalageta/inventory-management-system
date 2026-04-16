import express from 'express';
import { getStockLogs } from '../controllers/stockLogController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect(['Admin', 'Manager']), getStockLogs);

export default router;