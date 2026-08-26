const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'tracker.db');
const backupPath = path.resolve(__dirname, 'data_store_backup.json');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Load backup store from disk
function loadBackup() {
  try {
    if (fs.existsSync(backupPath)) {
      const content = fs.readFileSync(backupPath, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error loading data backup:', e.message);
  }
  return { users: [], expenses: [], splits: [], subscriptions: [], goals: [], credit_cards: [] };
}

// Save backup store to disk
function saveBackup(data) {
  try {
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving data backup:', e.message);
  }
}

// Sync all DB tables into persistent data_store_backup.json
function syncBackupFromDb() {
  const store = { users: [], expenses: [], splits: [], subscriptions: [], goals: [], credit_cards: [] };
  db.all(`SELECT * FROM users`, [], (err, users) => {
    if (!err && users) store.users = users;
    db.all(`SELECT * FROM expenses`, [], (err, expenses) => {
      if (!err && expenses) store.expenses = expenses;
      db.all(`SELECT * FROM group_splits`, [], (err, splits) => {
        if (!err && splits) store.splits = splits;
        db.all(`SELECT * FROM subscriptions`, [], (err, subs) => {
          if (!err && subs) store.subscriptions = subs;
          db.all(`SELECT * FROM financial_goals`, [], (err, goals) => {
            if (!err && goals) store.goals = goals;
            db.all(`SELECT * FROM credit_cards`, [], (err, cards) => {
              if (!err && cards) store.credit_cards = cards;
              saveBackup(store);
            });
          });
        });
      });
    });
  });
}

// Restore all users and transactions from persistent data_store_backup.json into SQLite on startup
function restoreBackupToDb() {
  const backup = loadBackup();

  // 1. Restore Users
  if (Array.isArray(backup.users) && backup.users.length > 0) {
    backup.users.forEach((u) => {
      db.get(`SELECT id FROM users WHERE email = ?`, [u.email], (err, row) => {
        if (!row) {
          db.run(
            `INSERT INTO users (name, email, password, role, plan, monthly_budget, is_verified, verification_token, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [u.name, u.email, u.password, u.role || 'user', u.plan || 'free', u.monthly_budget || 25000.0, u.is_verified || 1, u.verification_token || '', u.created_at || new Date().toISOString()]
          );
        }
      });
    });
  }

  // 2. Restore Expenses
  if (Array.isArray(backup.expenses) && backup.expenses.length > 0) {
    backup.expenses.forEach((e) => {
      db.get(`SELECT id FROM expenses WHERE id = ?`, [e.id], (err, row) => {
        if (!row) {
          db.run(
            `INSERT INTO expenses (id, user_id, amount, category, description, date, time, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [e.id, e.user_id, e.amount, e.category, e.description || '', e.date, e.time, e.type || 'expense', e.created_at || new Date().toISOString()]
          );
        }
      });
    });
  }

  // 3. Restore Splits
  if (Array.isArray(backup.splits) && backup.splits.length > 0) {
    backup.splits.forEach((s) => {
      db.get(`SELECT id FROM group_splits WHERE id = ?`, [s.id], (err, row) => {
        if (!row) {
          db.run(
            `INSERT INTO group_splits (id, user_id, title, total_amount, split_count, per_person, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [s.id, s.user_id, s.title, s.total_amount, s.split_count, s.per_person, s.created_at || new Date().toISOString()]
          );
        }
      });
    });
  }

  // 4. Restore Goals
  if (Array.isArray(backup.goals) && backup.goals.length > 0) {
    backup.goals.forEach((g) => {
      db.get(`SELECT id FROM financial_goals WHERE id = ?`, [g.id], (err, row) => {
        if (!row) {
          db.run(
            `INSERT INTO financial_goals (id, user_id, title, target_amount, saved_amount, deadline_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [g.id, g.user_id, g.title, g.target_amount, g.saved_amount || 0.0, g.deadline_date || '', g.created_at || new Date().toISOString()]
          );
        }
      });
    });
  }

  // 5. Restore Cards
  if (Array.isArray(backup.credit_cards) && backup.credit_cards.length > 0) {
    backup.credit_cards.forEach((c) => {
      db.get(`SELECT id FROM credit_cards WHERE id = ?`, [c.id], (err, row) => {
        if (!row) {
          db.run(
            `INSERT INTO credit_cards (id, user_id, card_name, due_date, statement_amount, min_due, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [c.id, c.user_id, c.card_name, c.due_date, c.statement_amount, c.min_due || 0.0, c.status || 'unpaid', c.created_at || new Date().toISOString()]
          );
        }
      });
    });
  }
}

db.serialize(() => {
  // Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      plan TEXT DEFAULT 'free',
      monthly_budget REAL DEFAULT 25000.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, () => {
    db.run(`ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free'`, (err) => {});
    db.run(`ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 1`, (err) => {});
    db.run(`ALTER TABLE users ADD COLUMN verification_token TEXT`, (err) => {});
    db.run(`ALTER TABLE users ADD COLUMN reset_token TEXT`, (err) => {});
    db.run(`ALTER TABLE users ADD COLUMN reset_token_expires DATETIME`, (err) => {});

    // Seed default admin and user if not existing
    db.get(`SELECT id FROM users WHERE email = ?`, ['admin@tracker.com'], async (err, row) => {
      if (!row) {
        const hashedAdminPass = await bcrypt.hash('admin123', 10);
        db.run(
          `INSERT INTO users (name, email, password, role, monthly_budget) VALUES (?, ?, ?, ?, ?)`,
          ['Admin', 'admin@tracker.com', hashedAdminPass, 'admin', 50000.0]
        );
      }
    });

    db.get(`SELECT id FROM users WHERE email = ?`, ['user@tracker.com'], async (err, row) => {
      if (!row) {
        const hashedUserPass = await bcrypt.hash('user123', 10);
        db.run(
          `INSERT INTO users (name, email, password, role, monthly_budget) VALUES (?, ?, ?, ?, ?)`,
          ['Heri Ghetiya', 'user@tracker.com', hashedUserPass, 'user', 25000.0]
        );
      }
    });

    // Restore any previously registered users and data from persistent backup file
    restoreBackupToDb();
  });

  // Payments Table
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      payment_id TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      method TEXT NOT NULL,
      status TEXT DEFAULT 'success',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Expenses & Income Table
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      type TEXT DEFAULT 'expense',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Group Splits Table
  db.run(`
    CREATE TABLE IF NOT EXISTS group_splits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      total_amount REAL NOT NULL,
      split_count INTEGER NOT NULL,
      per_person REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Subscriptions Table
  db.run(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      due_day INTEGER NOT NULL,
      category TEXT DEFAULT 'Bills & Utilities',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Financial Goals / Savings Vaults Table
  db.run(`
    CREATE TABLE IF NOT EXISTS financial_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      target_amount REAL NOT NULL,
      saved_amount REAL DEFAULT 0.0,
      deadline_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Credit Cards & Bills Manager Table
  db.run(`
    CREATE TABLE IF NOT EXISTS credit_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      card_name TEXT NOT NULL,
      due_date TEXT NOT NULL,
      statement_amount REAL NOT NULL,
      min_due REAL DEFAULT 0.0,
      status TEXT DEFAULT 'unpaid',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);
});

module.exports = {
  db,
  syncBackupFromDb
};
