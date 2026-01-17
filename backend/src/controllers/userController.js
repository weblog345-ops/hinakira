import prisma from '../config/database.js';
import { catchAsync } from '../utils/errorHandler.js';

// 全ユーザー一覧を取得（管理者専用）
export const getAllUsers = catchAsync(async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          sentMessages: true,
          receivedMessages: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({
    success: true,
    data: { users },
  });
});

// 特定のユーザー情報を取得
export const getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('ユーザーが見つかりません', 404);
  }

  res.json({
    success: true,
    data: { user },
  });
});

// メッセージ可能なユーザー一覧を取得
export const getAvailableUsers = catchAsync(async (req, res) => {
  let users;

  if (req.user.role === 'ADMIN') {
    // 管理者: 全ユーザーとメッセージ可能
    users = await prisma.user.findMany({
      where: {
        id: { not: req.user.id }, // 自分自身を除外
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  } else {
    // 一般会員: 管理者とのみメッセージ可能
    users = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  res.json({
    success: true,
    data: { users },
  });
});
