import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'dev.db');
console.log('📦 Creating database at:', dbPath);

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('🗄️  Creating tables...');

// Create tables based on Prisma schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'MEMBER',
    emailVerified INTEGER NOT NULL DEFAULT 1,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    senderId INTEGER NOT NULL,
    receiverId INTEGER NOT NULL,
    isRead INTEGER NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(senderId, receiverId);
  CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON messages(receiverId, isRead);
  CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(createdAt);
`);

console.log('✅ Tables created successfully');

// Create admin user
console.log('👤 Creating admin user...');

const adminEmail = 'admin@hinakira.app';
const adminPassword = 'admin123';
const adminName = 'Administrator';

const hashedPassword = bcrypt.hashSync(adminPassword, 10);

try {
  const insert = db.prepare(`
    INSERT INTO users (email, password, name, role, emailVerified)
    VALUES (?, ?, ?, 'ADMIN', 1)
  `);

  insert.run(adminEmail, hashedPassword, adminName);

  console.log('✅ Admin user created successfully');
  console.log('');
  console.log('📝 Login credentials:');
  console.log('   Email:', adminEmail);
  console.log('   Password:', adminPassword);
  console.log('');
  console.log('⚠️  Please change the password in production!');
} catch (error) {
  if (error.message.includes('UNIQUE constraint failed')) {
    console.log('⚠️  Admin user already exists');
  } else {
    throw error;
  }
}

db.close();
console.log('');
console.log('🎉 Database setup complete!');
