import express from 'express';
import {
  sendMessage,
  getConversation,
  getConversations,
  getUnreadCount,
  markAsRead,
  broadcastMessage,
} from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';
import { messageValidation, validate } from '../utils/validators.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// 全ルートで認証が必要
router.use(authenticate);

// メッセージ送信（ファイル添付対応）
router.post('/', upload.array('attachments', 5), messageValidation, validate, sendMessage);

// 一斉送信（管理者のみ）
router.post('/broadcast', broadcastMessage);

// 会話一覧を取得
router.get('/conversations', getConversations);

// 未読メッセージ数を取得
router.get('/unread-count', getUnreadCount);

// 特定のユーザーとの会話を取得
router.get('/:userId', getConversation);

// メッセージを既読にする
router.patch('/:messageId/read', markAsRead);

export default router;
