import { AppError } from '../utils/errorHandler.js';

// 管理者権限をチェック
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    throw new AppError('認証が必要です', 401);
  }

  if (req.user.role !== 'ADMIN') {
    throw new AppError('この操作には管理者権限が必要です', 403);
  }

  next();
};

// 特定のロールを要求
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('認証が必要です', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('この操作を実行する権限がありません', 403);
    }

    next();
  };
};

// メッセージのアクセス権限をチェック
export const checkMessageAccess = (req, res, next) => {
  if (!req.user) {
    throw new AppError('認証が必要です', 401);
  }

  const receiverId = parseInt(req.body.receiverId || req.params.receiverId);

  // 管理者は誰にでもメッセージ送信可能
  if (req.user.role === 'ADMIN') {
    return next();
  }

  // 一般会員は管理者にのみメッセージ送信可能
  // 受信者が管理者かどうかは後でコントローラーで確認
  next();
};
