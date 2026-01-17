import jwt from 'jsonwebtoken';
import { AppError, catchAsync } from '../utils/errorHandler.js';
import prisma from '../config/database.js';

// JWTトークンを検証してユーザー情報を取得
export const authenticate = catchAsync(async (req, res, next) => {
  // Authorizationヘッダーからトークンを取得
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('認証トークンが見つかりません', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    // トークンを検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('ユーザーが見つかりません', 401);
    }

    // リクエストオブジェクトにユーザー情報を追加
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('無効なトークンです', 401);
    }
    if (error.name === 'TokenExpiredError') {
      throw new AppError('トークンの有効期限が切れています', 401);
    }
    throw error;
  }
});

// オプショナル認証（トークンがあれば検証、なくてもOK）
export const optionalAuth = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (user) {
        req.user = user;
      }
    } catch (error) {
      // トークンが無効でもエラーにしない
      console.warn('Invalid token in optional auth:', error.message);
    }
  }

  next();
});
