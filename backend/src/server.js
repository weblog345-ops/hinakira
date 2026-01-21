import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './utils/errorHandler.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ルートのインポート
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import messageRoutes from './routes/messages.js';

// 環境変数の読み込み
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .envファイルを複数のパスから探して読み込む
const fs = await import('fs');
const possiblePaths = [
  join(__dirname, '..', '.env'),           // backend/.env
  join(__dirname, '..', '..', '.env'),     // hinakira/.env (project root)
];

for (const path of possiblePaths) {
  if (fs.existsSync(path)) {
    dotenv.config({ path });
    break;
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// ===== ミドルウェア設定 =====

// CORS設定
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// JSONパーサー
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// レート制限（セキュリティ対策）
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100リクエスト
  message: 'リクエストが多すぎます。しばらく待ってから再試行してください。',
  standardHeaders: true,
  legacyHeaders: false,
});

// 認証エンドポイントに厳しいレート制限
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // 最大5回のログイン試行
  message: 'ログイン試行回数が多すぎます。15分後に再試行してください。',
  skipSuccessfulRequests: true,
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// セキュリティヘッダー
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// ===== ルート設定 =====

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Hinakira API is running',
    timestamp: new Date().toISOString(),
  });
});

// APIルート
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// 404エラーハンドリング
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'エンドポイントが見つかりません',
  });
});

// グローバルエラーハンドラー
app.use(errorHandler);

// ===== サーバー起動 =====

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ========================================');
  console.log(`✨ Hinakira API Server is running`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log('🚀 ========================================');
  console.log('');
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('HTTP server closed');
  });
});
