// Try to use Prisma, fallback to SQLite if Prisma is not available
let prisma;

try {
  const { PrismaClient } = await import('@prisma/client');

  // Prismaクライアントのシングルトンインスタンス
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // グレースフルシャットダウン
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });

  console.log('✅ Using Prisma Client');
} catch (error) {
  console.warn('⚠️  Prisma Client not available, falling back to SQLite');

  // Fallback to SQLite wrapper
  const { default: sqlitePrisma } = await import('./database-sqlite.js');
  prisma = sqlitePrisma;
}

export default prisma;
