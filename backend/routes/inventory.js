import express from 'express';
const router = express.Router();

// ✅ Fixed: Both functions come from the same middleware file
import { protect, checkPermission } from '../middleware/authMiddleware.js';
import * as inventoryController from '../controllers/inventoryItemsController.js';

/**
 * 📦 INVENTORY ROUTES
 * All routes require authentication (protect)
 */

// Handle the base '/' path
router.route('/')
  .get(
    protect(), 
    checkPermission('view_inventory'), 
    inventoryController.getAllInventoryItems
  );

// Handle specific ID operations
router.route('/:id')
  .get(
    protect(), 
    checkPermission('view_inventory'), 
    inventoryController.getInventoryItem
  )
  .put(
    protect(), 
    checkPermission(['update_inventory', 'archive_inventory']), 
    inventoryController.updateInventoryItem
  )
  .delete(
    protect(), 
    checkPermission('archive_inventory'), 
    inventoryController.archiveInventoryItem
  );

// Add new inventory
router.post(
  '/add',
  protect(),
  checkPermission('add_inventory'),
  inventoryController.addInventoryItems
);

export default router;