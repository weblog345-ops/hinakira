import express from 'express';
import {
  getAllUsers,
  getUserById,
  getAvailableUsers,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleCheck.js';

const router = express.Router();

// 全ルートで認証が必要
router.use(authenticate);

// メッセージ可能なユーザー一覧を取得
router.get('/available', getAvailableUsers);

// 全ユーザー一覧を取得（管理者のみ）
router.get('/', requireAdmin, getAllUsers);

// 特定のユーザー情報を取得
router.get('/:id', getUserById);

export default router;
