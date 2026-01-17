import express from 'express';
import {
  register,
  login,
  getCurrentUser,
  updateProfile,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import {
  registerValidation,
  loginValidation,
  validate,
} from '../utils/validators.js';

const router = express.Router();

// 公開ルート
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);

// 認証が必要なルート
router.get('/me', authenticate, getCurrentUser);
router.patch('/profile', authenticate, updateProfile);

export default router;
