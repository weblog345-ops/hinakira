import express from 'express';
import {
  sendMessage,
  getConversation,
  getConversations,
  getUnreadCount,
  markAsRead,
} from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';
import { messageValidation, validate } from '../utils/validators.js';

const router = express.Router();

// 全ルートで認証が必要
router.use(authenticate);

// メッセージ送信
router.post('/', messageValidation, validate, sendMessage);

// 会話一覧を取得
router.get('/conversations', getConversations);

// 未読メッセージ数を取得
router.get('/unread-count', getUnreadCount);

// 特定のユーザーとの会話を取得
router.get('/:userId', getConversation);

// メッセージを既読にする
router.patch('/:messageId/read', markAsRead);

export default router;
