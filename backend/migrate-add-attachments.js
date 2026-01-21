import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'dev.db');
console.log('📦 データベースパス:', dbPath);

const db = new Database(dbPath);

console.log('🔧 messagesテーブルにattachmentsカラムを追加...');

try {
  // attachmentsカラムを追加（JSON形式で保存）
  db.exec(`
    ALTER TABLE messages ADD COLUMN attachments TEXT DEFAULT NULL;
  `);

  console.log('✅ attachmentsカラムを追加しました');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('⚠️  attachmentsカラムは既に存在します');
  } else {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

db.close();
console.log('✅ データベース更新完了！');
