// カスタムエラークラス
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// グローバルエラーハンドラーミドルウェア
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'サーバーエラーが発生しました';

  // 開発環境ではスタックトレースを表示
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      stack: err.stack,
    });
  }

  // 本番環境では詳細を隠す
  res.status(err.statusCode).json({
    success: false,
    error: err.isOperational ? err.message : 'サーバーエラーが発生しました',
  });
};

// 非同期エラーをキャッチするラッパー関数
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
