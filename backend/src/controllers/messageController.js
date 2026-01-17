import prisma from '../config/database.js';
import { AppError, catchAsync } from '../utils/errorHandler.js';
import { sendMessageNotification } from '../services/notificationService.js';

// メッセージを送信
export const sendMessage = catchAsync(async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user.id;

  // 受信者が存在するか確認
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
  });

  if (!receiver) {
    throw new AppError('受信者が見つかりません', 404);
  }

  // 自分自身にメッセージを送信できないようにする
  if (senderId === receiverId) {
    throw new AppError('自分自身にメッセージを送信することはできません', 400);
  }

  // 権限チェック: 一般会員は管理者にのみメッセージ送信可能
  if (req.user.role === 'MEMBER' && receiver.role !== 'ADMIN') {
    throw new AppError('一般会員は管理者とのみメッセージのやり取りができます', 403);
  }

  // メッセージを作成
  const message = await prisma.message.create({
    data: {
      content,
      senderId,
      receiverId,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      receiver: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  // メール通知を送信（非同期、エラーが発生してもメッセージ送信は成功）
  sendMessageNotification(message).catch(err => {
    console.error('メール通知の送信に失敗しました:', err);
  });

  res.status(201).json({
    success: true,
    message: 'メッセージを送信しました',
    data: { message },
  });
});

// メッセージ一覧を取得（特定のユーザーとの会話）
export const getConversation = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;
  const otherUserId = parseInt(userId);

  // 相手ユーザーが存在するか確認
  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
  });

  if (!otherUser) {
    throw new AppError('ユーザーが見つかりません', 404);
  }

  // 権限チェック: 一般会員は管理者とのメッセージのみ閲覧可能
  if (req.user.role === 'MEMBER' && otherUser.role !== 'ADMIN') {
    throw new AppError('このメッセージにアクセスする権限がありません', 403);
  }

  // 双方向のメッセージを取得
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      receiver: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // 受信した未読メッセージを既読にする
  await prisma.message.updateMany({
    where: {
      senderId: otherUserId,
      receiverId: currentUserId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  res.json({
    success: true,
    data: { messages },
  });
});

// 会話相手の一覧を取得（最後のメッセージ付き）
export const getConversations = catchAsync(async (req, res) => {
  const currentUserId = req.user.id;

  // 自分が送信または受信したメッセージから、ユニークな相手を取得
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: currentUserId },
        { receiverId: currentUserId },
      ],
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      receiver: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // 会話相手をマップで管理（最新のメッセージを保持）
  const conversationsMap = new Map();

  messages.forEach(message => {
    const otherUser = message.senderId === currentUserId ? message.receiver : message.sender;

    if (!conversationsMap.has(otherUser.id)) {
      conversationsMap.set(otherUser.id, {
        user: otherUser,
        lastMessage: message,
        unreadCount: 0,
      });
    }
  });

  // 未読メッセージ数をカウント
  const conversations = Array.from(conversationsMap.values());

  for (const conversation of conversations) {
    const unreadCount = await prisma.message.count({
      where: {
        senderId: conversation.user.id,
        receiverId: currentUserId,
        isRead: false,
      },
    });
    conversation.unreadCount = unreadCount;
  }

  res.json({
    success: true,
    data: { conversations },
  });
});

// 未読メッセージ数を取得
export const getUnreadCount = catchAsync(async (req, res) => {
  const unreadCount = await prisma.message.count({
    where: {
      receiverId: req.user.id,
      isRead: false,
    },
  });

  res.json({
    success: true,
    data: { unreadCount },
  });
});

// メッセージを既読にする
export const markAsRead = catchAsync(async (req, res) => {
  const { messageId } = req.params;

  const message = await prisma.message.findUnique({
    where: { id: parseInt(messageId) },
  });

  if (!message) {
    throw new AppError('メッセージが見つかりません', 404);
  }

  // 受信者のみが既読にできる
  if (message.receiverId !== req.user.id) {
    throw new AppError('このメッセージを既読にする権限がありません', 403);
  }

  const updatedMessage = await prisma.message.update({
    where: { id: parseInt(messageId) },
    data: { isRead: true },
  });

  res.json({
    success: true,
    message: 'メッセージを既読にしました',
    data: { message: updatedMessage },
  });
});
