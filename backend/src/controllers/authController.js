import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { AppError, catchAsync } from '../utils/errorHandler.js';

// JWTトークンを生成
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ユーザー登録
export const register = catchAsync(async (req, res) => {
  const { email, password, name } = req.body;

  // メールアドレスの重複チェック
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('このメールアドレスは既に登録されています', 400);
  }

  // パスワードをハッシュ化
  const hashedPassword = await bcrypt.hash(password, 10);

  // ユーザーを作成
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'MEMBER', // デフォルトは一般会員
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  // JWTトークンを生成
  const token = generateToken(user.id);

  res.status(201).json({
    success: true,
    message: 'ユーザー登録が完了しました',
    data: {
      user,
      token,
    },
  });
});

// ログイン
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // ユーザーを検索（パスワードも含めて取得）
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError('メールアドレスまたはパスワードが正しくありません', 401);
  }

  // パスワードを検証
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError('メールアドレスまたはパスワードが正しくありません', 401);
  }

  // JWTトークンを生成
  const token = generateToken(user.id);

  // パスワードを除外してレスポンスを返す
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: 'ログインに成功しました',
    data: {
      user: userWithoutPassword,
      token,
    },
  });
});

// 現在のユーザー情報を取得
export const getCurrentUser = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
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

// プロフィール更新
export const updateProfile = catchAsync(async (req, res) => {
  const { name } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { name },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      updatedAt: true,
    },
  });

  res.json({
    success: true,
    message: 'プロフィールを更新しました',
    data: { user },
  });
});
