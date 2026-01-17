import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import prisma from '../config/database.js';

dotenv.config();

async function seed() {
  try {
    console.log('🌱 データベースのシード処理を開始します...');

    // 既存の管理者アカウントを確認
    const existingAdmin = await prisma.user.findUnique({
      where: { email: process.env.ADMIN_EMAIL },
    });

    if (existingAdmin) {
      console.log('⚠️  管理者アカウントは既に存在します');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      return;
    }

    // 管理者アカウントを作成
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    const admin = await prisma.user.create({
      data: {
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        name: process.env.ADMIN_NAME,
        role: 'ADMIN',
        emailVerified: true,
      },
    });

    console.log('✅ 管理者アカウントを作成しました');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
    console.log('');
    console.log('📝 ログイン情報:');
    console.log(`   Email: ${process.env.ADMIN_EMAIL}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD}`);
    console.log('');
    console.log('⚠️  本番環境では必ずパスワードを変更してください！');

  } catch (error) {
    console.error('❌ シード処理中にエラーが発生しました:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
