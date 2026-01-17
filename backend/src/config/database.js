import { PrismaClient } from '@prisma/client';

// Prismaクライアントのシングルトンインスタンス
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// グレースフルシャットダウン
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
