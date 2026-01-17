import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// メール送信用のトランスポーター設定
const createTransporter = () => {
  // 開発環境用: Ethereal Email（テスト用メールサービス）を使用可能
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    console.warn('⚠️  Email configuration not set. Email notifications will be logged to console.');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const transporter = createTransporter();

export default transporter;
