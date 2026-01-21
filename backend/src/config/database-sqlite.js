import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', '..', '..', 'dev.db');

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Prisma-like API wrapper
const prisma = {
  user: {
    findUnique({ where, select, include }) {
      const columns = select ? Object.keys(select).join(', ') : '*';

      if (where.id) {
        const stmt = db.prepare(`SELECT ${columns} FROM users WHERE id = ?`);
        return stmt.get(where.id);
      }
      if (where.email) {
        const stmt = db.prepare(`SELECT ${columns} FROM users WHERE email = ?`);
        return stmt.get(where.email);
      }
      return null;
    },

    findMany({ where, select, orderBy, include }) {
      const columns = select ? Object.keys(select).filter(k => k !== '_count').join(', ') : '*';
      let query = `SELECT ${columns} FROM users`;
      const params = [];

      if (where) {
        const conditions = [];
        if (where.id) {
          conditions.push('id = ?');
          params.push(where.id.not || where.id);
        }
        if (where.role) {
          conditions.push('role = ?');
          params.push(where.role);
        }
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }

      if (orderBy) {
        const orderClauses = Object.entries(orderBy).map(([key, dir]) => `${key} ${dir.toUpperCase()}`);
        query += ' ORDER BY ' + orderClauses.join(', ');
      }

      const stmt = db.prepare(query);
      const results = stmt.all(...params);

      // Add _count if requested
      if (select && select._count) {
        results.forEach(user => {
          user._count = {
            sentMessages: db.prepare('SELECT COUNT(*) as count FROM messages WHERE senderId = ?').get(user.id).count,
            receivedMessages: db.prepare('SELECT COUNT(*) as count FROM messages WHERE receiverId = ?').get(user.id).count
          };
        });
      }

      return results;
    },

    create({ data, select }) {
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);

      const stmt = db.prepare(`INSERT INTO users (${columns}) VALUES (${placeholders})`);
      const result = stmt.run(...values);

      const selectColumns = select ? Object.keys(select).join(', ') : '*';
      return db.prepare(`SELECT ${selectColumns} FROM users WHERE id = ?`).get(result.lastInsertRowid);
    },

    update({ where, data, select }) {
      const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data), where.id];

      const stmt = db.prepare(`UPDATE users SET ${updates}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`);
      stmt.run(...values);

      const selectColumns = select ? Object.keys(select).join(', ') : '*';
      return db.prepare(`SELECT ${selectColumns} FROM users WHERE id = ?`).get(where.id);
    },

    count({ where }) {
      let query = 'SELECT COUNT(*) as count FROM users';
      const params = [];

      if (where) {
        const conditions = [];
        if (where.senderId && where.receiverId && where.isRead !== undefined) {
          // This is likely a message count, redirect
          return prisma.message.count({ where });
        }
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }

      return db.prepare(query).get(...params).count;
    }
  },

  message: {
    create({ data, include }) {
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);

      const stmt = db.prepare(`INSERT INTO messages (${columns}) VALUES (${placeholders})`);
      const result = stmt.run(...values);

      // Fetch the created message with relations
      let message = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);

      if (include) {
        if (include.sender) {
          message.sender = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(message.senderId);
        }
        if (include.receiver) {
          message.receiver = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(message.receiverId);
        }
      }

      return message;
    },

    findMany({ where, include, orderBy }) {
      let query = 'SELECT * FROM messages';
      const params = [];

      if (where) {
        const conditions = [];

        if (where.OR) {
          const orConditions = where.OR.map(condition => {
            const parts = [];
            if (condition.senderId !== undefined && condition.receiverId !== undefined) {
              parts.push('(senderId = ? AND receiverId = ?)');
              params.push(condition.senderId, condition.receiverId);
            } else if (condition.senderId !== undefined) {
              parts.push('senderId = ?');
              params.push(condition.senderId);
            } else if (condition.receiverId !== undefined) {
              parts.push('receiverId = ?');
              params.push(condition.receiverId);
            }
            return parts.join(' AND ');
          }).filter(cond => cond !== '');

          if (orConditions.length > 0) {
            conditions.push('(' + orConditions.join(' OR ') + ')');
          }
        } else {
          if (where.senderId !== undefined) {
            conditions.push('senderId = ?');
            params.push(where.senderId);
          }
          if (where.receiverId !== undefined) {
            conditions.push('receiverId = ?');
            params.push(where.receiverId);
          }
          if (where.isRead !== undefined) {
            conditions.push('isRead = ?');
            params.push(where.isRead ? 1 : 0);
          }
        }

        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }

      if (orderBy) {
        const orderClauses = Object.entries(orderBy).map(([key, dir]) => `${key} ${dir.toUpperCase()}`);
        query += ' ORDER BY ' + orderClauses.join(', ');
      }

      const stmt = db.prepare(query);
      const messages = stmt.all(...params);

      // Add relations if requested
      if (include) {
        messages.forEach(msg => {
          if (include.sender) {
            msg.sender = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(msg.senderId);
          }
          if (include.receiver) {
            msg.receiver = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(msg.receiverId);
          }
        });
      }

      return messages;
    },

    findUnique({ where, include }) {
      const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(where.id);

      if (!message) return null;

      if (include) {
        if (include.sender) {
          message.sender = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(message.senderId);
        }
        if (include.receiver) {
          message.receiver = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(message.receiverId);
        }
      }

      return message;
    },

    updateMany({ where, data }) {
      const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = Object.values(data).map(v => typeof v === 'boolean' ? (v ? 1 : 0) : v);

      let query = `UPDATE messages SET ${updates}, updatedAt = CURRENT_TIMESTAMP`;
      const params = [...values];

      if (where) {
        const conditions = [];
        if (where.senderId !== undefined) {
          conditions.push('senderId = ?');
          params.push(where.senderId);
        }
        if (where.receiverId !== undefined) {
          conditions.push('receiverId = ?');
          params.push(where.receiverId);
        }
        if (where.isRead !== undefined) {
          conditions.push('isRead = ?');
          params.push(where.isRead ? 1 : 0);
        }
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }

      const stmt = db.prepare(query);
      return stmt.run(...params);
    },

    update({ where, data }) {
      const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data).map(v => typeof v === 'boolean' ? (v ? 1 : 0) : v), where.id];

      const stmt = db.prepare(`UPDATE messages SET ${updates}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`);
      stmt.run(...values);

      return db.prepare('SELECT * FROM messages WHERE id = ?').get(where.id);
    },

    count({ where }) {
      let query = 'SELECT COUNT(*) as count FROM messages';
      const params = [];

      if (where) {
        const conditions = [];
        if (where.senderId !== undefined) {
          conditions.push('senderId = ?');
          params.push(where.senderId);
        }
        if (where.receiverId !== undefined) {
          conditions.push('receiverId = ?');
          params.push(where.receiverId);
        }
        if (where.isRead !== undefined) {
          conditions.push('isRead = ?');
          params.push(where.isRead ? 1 : 0);
        }
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }

      return db.prepare(query).get(...params).count;
    }
  },

  $disconnect: async () => {
    db.close();
  }
};

process.on('beforeExit', () => {
  db.close();
});

export default prisma;
