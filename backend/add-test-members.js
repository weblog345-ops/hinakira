import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'dev.db');
const db = new Database(dbPath);

const testUsers = [
  { name: '田中太郎', email: 'tanaka@example.com', role: 'MEMBER' },
  { name: '佐藤花子', email: 'sato@example.com', role: 'MEMBER' },
  { name: '鈴木一郎', email: 'suzuki@example.com', role: 'MEMBER' },
  { name: '高橋美咲', email: 'takahashi@example.com', role: 'MEMBER' },
  { name: '伊藤健太', email: 'ito@example.com', role: 'MEMBER' }
];

async function addTestMembers() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  const insert = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
  
  console.log('📝 テストメンバーを追加中...');
  console.log('');
  
  let added = 0;
  for (const user of testUsers) {
    try {
      insert.run(user.name, user.email, hashedPassword, user.role);
      console.log(`✅ ${user.name} (${user.email}) を追加しました`);
      added++;
    } catch (error) {
      if (error.message.includes('UNIQUE')) {
        console.log(`⏭️  ${user.name} (${user.email}) は既に存在します`);
      } else {
        console.log(`❌ ${user.name} の追加に失敗: ${error.message}`);
      }
    }
  }
  
  console.log('');
  console.log(`✅ ${added}人のテストメンバーを追加しました`);
  console.log('パスワード: password123');
  console.log('');
  
  const users = db.prepare('SELECT id, name, email, role FROM users ORDER BY id').all();
  console.log('📊 現在の全ユーザー:');
  console.log('================');
  users.forEach(user => {
    console.log(`ID: ${user.id} | ${user.name} (${user.email}) - ${user.role}`);
  });
  console.log(`\n合計: ${users.length}人`);
  
  db.close();
}

addTestMembers().catch(console.error);
