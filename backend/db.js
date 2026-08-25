const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'tracker.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

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
    // Migration: add plan column if missing
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
        console.log('Seeded default Admin account: admin@tracker.com / admin123');
      }
    });

    db.get(`SELECT id FROM users WHERE email = ?`, ['user@tracker.com'], async (err, row) => {
      if (!row) {
        const hashedUserPass = await bcrypt.hash('user123', 10);
        db.run(
          `INSERT INTO users (name, email, password, role, monthly_budget) VALUES (?, ?, ?, ?, ?)`,
          ['Heri Ghetiya', 'user@tracker.com', hashedUserPass, 'user', 25000.0]
        );
        console.log('Seeded default User account: user@tracker.com / user123');
      }
    });
  });

  // Payments Table for TrueBalance PRO subscriptions
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

module.exports = db;
