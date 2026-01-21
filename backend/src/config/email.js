import dotenv from 'dotenv';

dotenv.config();

let transporter = null;

// メール送信用のトランスポーター設定
const createTransporter = async () => {
  // 開発環境用: Ethereal Email（テスト用メールサービス）を使用可能
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    console.warn('⚠️  Email configuration not set. Email notifications will be logged to console.');
    return null;
  }

  try {
    const nodemailer = await import('nodemailer');
    return nodemailer.default.createTransporter({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } catch (error) {
    console.warn('⚠️  Failed to load nodemailer. Email notifications will be logged to console.');
    return null;
  }
};

// Initialize transporter lazily
createTransporter().then(t => {
  transporter = t;
});

export default transporter;
