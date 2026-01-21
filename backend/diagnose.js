import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 診断を開始します...\n');

// Check database path
const dbPath = join(__dirname, '..', 'dev.db');
console.log('1️⃣ データベースパス:', dbPath);
console.log('   ファイルは存在しますか?', existsSync(dbPath) ? '✅ はい' : '❌ いいえ');

if (!existsSync(dbPath)) {
  console.log('\n❌ データベースファイルが見つかりません！');
  console.log('   以下のコマンドを実行してください:');
  console.log('   node setup-db.js');
  process.exit(1);
}

console.log('\n2️⃣ データベースに接続しています...');
const db = new Database(dbPath);

// Check if tables exist
console.log('\n3️⃣ テーブルの確認:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('   見つかったテーブル:', tables.map(t => t.name).join(', '));

// Check users table
console.log('\n4️⃣ ユーザーの確認:');
const users = db.prepare('SELECT id, email, name, role FROM users').all();
console.log(`   ユーザー数: ${users.length}`);
users.forEach(user => {
  console.log(`   - ${user.email} (${user.role})`);
});

// Check admin user specifically
console.log('\n5️⃣ 管理者アカウントの確認:');
const admin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@hinakira.app');

if (!admin) {
  console.log('   ❌ 管理者アカウントが見つかりません！');
  console.log('   以下のコマンドを実行してください:');
  console.log('   node setup-db.js');
  db.close();
  process.exit(1);
}

console.log('   ✅ 管理者アカウントが見つかりました');
console.log('   Email:', admin.email);
console.log('   Name:', admin.name);
console.log('   Role:', admin.role);
console.log('   Password hash:', admin.password.substring(0, 20) + '...');

// Test password verification
console.log('\n6️⃣ パスワード検証テスト:');
const testPassword = 'admin123';
console.log(`   テストパスワード: "${testPassword}"`);

try {
  const isValid = bcrypt.compareSync(testPassword, admin.password);
  console.log('   結果:', isValid ? '✅ パスワードが一致します' : '❌ パスワードが一致しません');

  if (!isValid) {
    console.log('\n   ❌ パスワードハッシュに問題があります！');
    console.log('   データベースを再作成してください:');
    console.log('   1. データベースファイルを削除');
    console.log('   2. node setup-db.js を実行');
  }
} catch (error) {
  console.log('   ❌ エラー:', error.message);
}

db.close();

console.log('\n✅ 診断完了！');
