import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  me,
  getUsers,
  updateUser,
  deleteUser,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  getUserById,
  deactivateUser,
  activateUser  
} from '../controllers/authController.js';

import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

router.get('/me', protect(), me);
router.put('/profile', protect(),  upload.single('image'),  updateProfile);
router.post('/register', protect(['Admin']), register);

router.get('/users', protect(['Admin']), getUsers);
router.get('/users/:id', protect(), getUserById);

router.put('/users/:id', protect(['Admin']), upload.single('image'), updateUser);

router.put('/users/:id/deactivate', protect(['Admin']), deactivateUser);
router.put('/users/:id/activate', protect(['Admin']), activateUser);

router.delete('/users/:id', protect(['Admin']), deleteUser);

router.put('/change-password', protect(), changePassword);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;