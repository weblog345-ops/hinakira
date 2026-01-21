import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'dev.db');
console.log('📦 データベースパス:', dbPath);

const db = new Database(dbPath);

console.log('\n👥 登録されているユーザー一覧:\n');

const users = db.prepare('SELECT id, email, name, role, createdAt FROM users ORDER BY id').all();

if (users.length === 0) {
  console.log('❌ ユーザーが見つかりません');
} else {
  users.forEach(user => {
    console.log(`ID: ${user.id}`);
    console.log(`  名前: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  役割: ${user.role}`);
    console.log(`  登録日: ${user.createdAt}`);
    console.log('');
  });
  console.log(`合計: ${users.length}人のユーザー`);
}

db.close();
