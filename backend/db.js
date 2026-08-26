const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbFilePath = path.resolve(__dirname, 'data_store.json');

// In-memory atomic data store schema
let store = {
  users: [],
  expenses: [],
  group_splits: [],
  subscriptions: [],
  financial_goals: [],
  credit_cards: [],
  payments: []
};

// Load store atomically from disk
function loadStore() {
  try {
    if (fs.existsSync(dbFilePath)) {
      const raw = fs.readFileSync(dbFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      store = {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        group_splits: Array.isArray(parsed.group_splits) ? parsed.group_splits : [],
        subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [],
        financial_goals: Array.isArray(parsed.financial_goals) ? parsed.financial_goals : [],
        credit_cards: Array.isArray(parsed.credit_cards) ? parsed.credit_cards : [],
        payments: Array.isArray(parsed.payments) ? parsed.payments : []
      };
    }
  } catch (err) {
    console.error('[DB ENGINE ERROR] Failed to load data_store.json:', err.message);
  }
}

// Save store atomically using temp file rename swap to guarantee zero corruption
function persistStore() {
  try {
    const tmpPath = `${dbFilePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), 'utf8');
    fs.renameSync(tmpPath, dbFilePath);
  } catch (err) {
    console.error('[DB ENGINE ERROR] Atomic save failed:', err.message);
  }
}

// Initialize database store at startup
loadStore();

// Seed Default Accounts if missing
async function seedDefaults() {
  let modified = false;

  const adminExists = store.users.some(u => u.email === 'admin@tracker.com');
  if (!adminExists) {
    const hashedAdminPass = await bcrypt.hash('admin123', 10);
    store.users.push({
      id: store.users.length > 0 ? Math.max(...store.users.map(u => u.id)) + 1 : 1,
      name: 'Admin',
      email: 'admin@tracker.com',
      password: hashedAdminPass,
      role: 'admin',
      plan: 'pro',
      monthly_budget: 50000.0,
      is_verified: 1,
      created_at: new Date().toISOString()
    });
    modified = true;
  }

  const userExists = store.users.some(u => u.email === 'user@tracker.com');
  if (!userExists) {
    const hashedUserPass = await bcrypt.hash('user123', 10);
    store.users.push({
      id: store.users.length > 0 ? Math.max(...store.users.map(u => u.id)) + 1 : 2,
      name: 'Heri Ghetiya',
      email: 'user@tracker.com',
      password: hashedUserPass,
      role: 'user',
      plan: 'free',
      monthly_budget: 25000.0,
      is_verified: 1,
      created_at: new Date().toISOString()
    });
    modified = true;
  }

  if (modified) persistStore();
}

seedDefaults();

// SQL Emulation Wrapper Interface for Express Server
const db = {
  serialize: (fn) => { if (typeof fn === 'function') fn(); },

  run: function (query, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    const q = query.trim();

    // 1. CREATE / ALTER TABLE Schema Statements
    if (q.startsWith('CREATE TABLE') || q.startsWith('ALTER TABLE')) {
      if (typeof callback === 'function') callback.call({ lastID: 0, changes: 0 }, null);
      return;
    }

    // 2. INSERT INTO users
    if (q.includes('INSERT INTO users')) {
      const [name, email, password, role, monthly_budget, is_verified, verification_token] = params;
      const cleanEmail = (email || '').trim().toLowerCase();
      const existing = store.users.find(u => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        const err = new Error('UNIQUE constraint failed: users.email');
        if (typeof callback === 'function') callback(err);
        return;
      }
      const newId = store.users.length > 0 ? Math.max(...store.users.map(u => u.id)) + 1 : 1;
      const newUser = {
        id: newId,
        name: (name || '').trim(),
        email: cleanEmail,
        password,
        role: role === 'admin' ? 'admin' : 'user',
        plan: 'free',
        monthly_budget: parseFloat(monthly_budget || 25000.0),
        is_verified: is_verified !== undefined ? is_verified : 1,
        verification_token: verification_token || '',
        reset_token: '',
        reset_token_expires: null,
        created_at: new Date().toISOString()
      };
      store.users.push(newUser);
      persistStore();
      if (typeof callback === 'function') callback.call({ lastID: newId, changes: 1 }, null);
      return;
    }

    // 3. UPDATE users
    if (q.includes('UPDATE users SET monthly_budget = ? WHERE id = ?')) {
      const [budget, userId] = params;
      const idx = store.users.findIndex(u => u.id == userId);
      if (idx !== -1) {
        store.users[idx].monthly_budget = parseFloat(budget || 25000.0);
        persistStore();
        if (typeof callback === 'function') callback.call({ lastID: userId, changes: 1 }, null);
      } else {
        if (typeof callback === 'function') callback.call({ lastID: 0, changes: 0 }, null);
      }
      return;
    }

    if (q.includes('UPDATE users SET name = ?, email = ?, monthly_budget = ? WHERE id = ?')) {
      const [name, email, budget, userId] = params;
      const idx = store.users.findIndex(u => u.id == userId);
      if (idx !== -1) {
        store.users[idx].name = name;
        store.users[idx].email = (email || '').trim().toLowerCase();
        store.users[idx].monthly_budget = parseFloat(budget || 25000.0);
        persistStore();
        if (typeof callback === 'function') callback.call({ lastID: userId, changes: 1 }, null);
      } else {
        if (typeof callback === 'function') callback.call({ lastID: 0, changes: 0 }, null);
      }
      return;
    }

    if (q.includes(`UPDATE users SET plan = 'pro' WHERE id = ?`)) {
      const [userId] = params;
      const idx = store.users.findIndex(u => u.id == userId);
      if (idx !== -1) {
        store.users[idx].plan = 'pro';
        persistStore();
        if (typeof callback === 'function') callback.call({ lastID: userId, changes: 1 }, null);
      } else {
        if (typeof callback === 'function') callback.call({ lastID: 0, changes: 0 }, null);
      }
      return;
    }

    if (q.includes('UPDATE users SET password = ? WHERE id = ?')) {
      const [password, userId] = params;
      const idx = store.users.findIndex(u => u.id == userId);
      if (idx !== -1) {
        store.users[idx].password = password;
        persistStore();
        if (typeof callback === 'function') callback.call({ lastID: userId, changes: 1 }, null);
      } else {
        if (typeof callback === 'function') callback.call({ lastID: 0, changes: 0 }, null);
      }
      return;
    }

    if (q.includes('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?')) {
      const [token, expires, userId] = params;
      const idx = store.users.findIndex(u => u.id == userId);
      if (idx !== -1) {
        store.users[idx].reset_token = token;
        store.users[idx].reset_token_expires = expires;
        persistStore();
        if (typeof callback === 'function') callback.call({ lastID: userId, changes: 1 }, null);
      } else {
        if (typeof callback === 'function') callback.call({ lastID: 0, changes: 0 }, null);
      }
      return;
    }

    if (q.includes('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?')) {
      const [password, userId] = params;
      const idx = store.users.findIndex(u => u.id == userId);
      if (idx !== -1) {
        store.users[idx].password = password;
        store.users[idx].reset_token = '';
        store.users[idx].reset_token_expires = null;
        persistStore();
        if (typeof callback === 'function') callback.call({ lastID: userId, changes: 1 }, null);
      } else {
        if (typeof callback === 'function') callback.call({ lastID: 0, changes: 0 }, null);
      }
      return;
    }

    // 4. INSERT INTO payments
    if (q.includes('INSERT INTO payments')) {
      const [userId, payment_id, amount, currency, method, status] = params;
      const newId = store.payments.length > 0 ? Math.max(...store.payments.map(p => p.id)) + 1 : 1;
      const newPayment = {
        id: newId,
        user_id: parseInt(userId),
        payment_id,
        amount: parseFloat(amount),
        currency: currency || 'INR',
        method: method || 'UPI_QR',
        status: status || 'success',
        created_at: new Date().toISOString()
      };
      store.payments.push(newPayment);
      persistStore();
      if (typeof callback === 'function') callback.call({ lastID: newId, changes: 1 }, null);
      return;
    }

    // 5. INSERT INTO expenses
    if (q.includes('INSERT INTO expenses')) {
      const [userId, amount, category, description, date, time, type] = params;
      const newId = store.expenses.length > 0 ? Math.max(...store.expenses.map(e => e.id)) + 1 : 1;
      const newExp = {
        id: newId,
        user_id: parseInt(userId),
        amount: parseFloat(amount),
        category,
        description: description || '',
        date,
        time,
        type: type || 'expense',
        created_at: new Date().toISOString()
      };
      store.expenses.push(newExp);
      persistStore();
      if (typeof callback === 'function') callback.call({ lastID: newId, changes: 1 }, null);
      return;
    }

    // 6. UPDATE expenses
    if (q.includes('UPDATE expenses SET')) {
      const [amount, category, description, date, time, type, expId, userId] = params;
      const idx = store.expenses.findIndex(e => e.id == expId && e.user_id == userId);
      if (idx !== -1) {
        store.expenses[idx] = {
          ...store.expenses[idx],
          amount: parseFloat(amount),
          category,
          description: description || '',
          date,
          time,
          type: type || 'expense'
        };
        persistStore();
        if (typeof callback === 'function') callback.call({ lastID: expId, changes: 1 }, null);
      } else {
        if (typeof callback === 'function') callback.call({ lastID: 0, changes: 0 }, null);
      }
      return;
    }

    // 7. DELETE FROM expenses
    if (q.includes('DELETE FROM expenses')) {
      const [expId, userId] = params;
      const initialLen = store.expenses.length;
      store.expenses = store.expenses.filter(e => !(e.id == expId && e.user_id == userId));
      const changes = initialLen - store.expenses.length;
      persistStore();
      if (typeof callback === 'function') callback.call({ lastID: 0, changes }, null);
      return;
    }

    // 8. INSERT INTO group_splits
    if (q.includes('INSERT INTO group_splits')) {
      const [userId, title, total_amount, split_count, per_person] = params;
      const newId = store.group_splits.length > 0 ? Math.max(...store.group_splits.map(s => s.id)) + 1 : 1;
      const newSplit = {
        id: newId,
        user_id: parseInt(userId),
        title,
        total_amount: parseFloat(total_amount),
        split_count: parseInt(split_count),
        per_person: parseFloat(per_person),
        created_at: new Date().toISOString()
      };
      store.group_splits.push(newSplit);
      persistStore();
      if (typeof callback === 'function') callback.call({ lastID: newId, changes: 1 }, null);
      return;
    }

    // DELETE FROM group_splits
    if (q.includes('DELETE FROM group_splits')) {
      const [splitId, userId] = params;
      const initialLen = store.group_splits.length;
      store.group_splits = store.group_splits.filter(s => !(s.id == splitId && s.user_id == userId));
      const changes = initialLen - store.group_splits.length;
      persistStore();
      if (typeof callback === 'function') callback.call({ lastID: 0, changes }, null);
      return;
    }

    // 9. INSERT INTO subscriptions
    if (q.includes('INSERT INTO subscriptions')) {
      const [userId, title, amount, due_day, category] = params;
      const newId = store.subscriptions.length > 0 ? Math.max(...store.subscriptions.map(s => s.id)) + 1 : 1;
      const newSub = {
        id: newId,
        user_id: parseInt(userId),
        title,
        amount: parseFloat(amount),
        due_day: parseInt(due_day),
        category: category || 'Bills & Utilities',
        created_at: new Date().toISOString()
      };
      store.subscriptions.push(newSub);
      persistStore();
      if (typeof callback === 'function') callback.call({ lastID: newId, changes: 1 }, null);
      return;
    }

    // DELETE FROM subscriptions
    if (q.includes('DELETE FROM subscriptions')) {
      const [subId, userId] = params;
      const initialLen = store.subscriptions.length;
      store.subscriptions = store.subscriptions.filter(s => !(s.id == subId && s.user_id == userId));
      const changes = initialLen - store.subscriptions.length;
      persistStore();
      if (typeof callback === 'function') callback.call({ lastID: 0, changes }, null);
      return;
    }

    // 10. INSERT INTO financial_goals
    if (q.includes('INSERT INTO financial_goals')) {
      const [userId, title, target_amount, saved_amount, deadline_date] = params;
      const newId = store.financial_goals.length > 0 ? Math.max(...store.financial_goals.map(g => g.id)) + 1 : 1;
      const newGoal = {
        id: newId,
        user_id: parseInt(userId),
        title,
        target_amount: parseFloat(target_amount),
        saved_amount: parseFloat(saved_amount || 0),
        deadline_date: deadline_date || '',
        created_at: new Date().toISOString()
      };
      store.financial_goals.push(newGoal);
      persistStore();
      if (typeof callback === 'function') callback.call({ lastID: newId, changes: 1 }, null);
      return;
    }

    // UPDATE financial_goals deposit
    if (q.includes('UPDATE financial_goals SET saved_amount = saved_amount + ?')) {
      const [addAmount, goalId, userId] = params;
      const idx = store.financial_goals.findIndex(g => g.id == goalId && g.user_id == userId);
      if (idx !== -1) {
        store.financial_goals[idx].saved_amount += parseFloat(addAmount);
        persistStore();
        if (typeof callback === 'function') callback.call({ lastID: goalId, changes: 1 }, null);
      } else {
        if (typeof callback === 'function') callback.call({ lastID: 0, changes: 0 }, null);
      }
      return;
    }

    // DELETE FROM financial_goals
    if (q.includes('DELETE FROM financial_goals')) {
      const [goalId, userId] = params;
      const initialLen = store.financial_goals.length;
      store.financial_goals = store.financial_goals.filter(g => !(g.id == goalId && g.user_id == userId));
      const changes = initialLen - store.financial_goals.length;
      persistStore();
      if (typeof callback === 'function') callback.call({ lastID: 0, changes }, null);
      return;
    }

    // 11. INSERT INTO credit_cards
    if (q.includes('INSERT INTO credit_cards')) {
      const [userId, card_name, due_date, statement_amount, min_due] = params;
      const newId = store.credit_cards.length > 0 ? Math.max(...store.credit_cards.map(c => c.id)) + 1 : 1;
      const newCard = {
        id: newId,
        user_id: parseInt(userId),
        card_name,
        due_date,
        statement_amount: parseFloat(statement_amount),
        min_due: parseFloat(min_due || 0),
        status: 'unpaid',
        created_at: new Date().toISOString()
      };
      store.credit_cards.push(newCard);
      persistStore();
      if (typeof callback === 'function') callback.call({ lastID: newId, changes: 1 }, null);
      return;
    }

    // UPDATE credit_cards pay
    if (q.includes(`UPDATE credit_cards SET status = 'paid' WHERE id = ? AND user_id = ?`)) {
      const [cardId, userId] = params;
      const idx = store.credit_cards.findIndex(c => c.id == cardId && c.user_id == userId);
      if (idx !== -1) {
        store.credit_cards[idx].status = 'paid';
        persistStore();
        if (typeof callback === 'function') callback.call({ lastID: cardId, changes: 1 }, null);
      } else {
        if (typeof callback === 'function') callback.call({ lastID: 0, changes: 0 }, null);
      }
      return;
    }

    // DELETE FROM credit_cards
    if (q.includes('DELETE FROM credit_cards')) {
      const [cardId, userId] = params;
      const initialLen = store.credit_cards.length;
      store.credit_cards = store.credit_cards.filter(c => !(c.id == cardId && c.user_id == userId));
      const changes = initialLen - store.credit_cards.length;
      persistStore();
      if (typeof callback === 'function') callback.call({ lastID: 0, changes }, null);
      return;
    }

    // Fallback run
    if (typeof callback === 'function') callback.call({ lastID: 0, changes: 1 }, null);
  },

  get: function (query, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    const q = query.trim();

    // SELECT user by email
    if (q.includes('FROM users WHERE email = ?')) {
      const [email] = params;
      const user = store.users.find(u => u.email.toLowerCase() === (email || '').trim().toLowerCase());
      if (typeof callback === 'function') callback(null, user ? { ...user } : undefined);
      return;
    }

    // SELECT user by id
    if (q.includes('FROM users WHERE id = ?')) {
      const [id] = params;
      const user = store.users.find(u => u.id == id);
      if (typeof callback === 'function') callback(null, user ? { ...user } : undefined);
      return;
    }

    // SELECT user by reset_token
    if (q.includes('FROM users WHERE reset_token = ?')) {
      const [token] = params;
      const user = store.users.find(u => u.reset_token === token);
      if (typeof callback === 'function') callback(null, user ? { ...user } : undefined);
      return;
    }

    // SELECT goal by id and user_id
    if (q.includes('FROM financial_goals WHERE id = ? AND user_id = ?')) {
      const [id, userId] = params;
      const goal = store.financial_goals.find(g => g.id == id && g.user_id == userId);
      if (typeof callback === 'function') callback(null, goal ? { ...goal } : undefined);
      return;
    }

    if (typeof callback === 'function') callback(null, undefined);
  },

  all: function (query, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    const q = query.trim();

    // SELECT ALL users
    if (q.includes('FROM users')) {
      const list = store.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        plan: u.plan || 'free',
        monthly_budget: u.monthly_budget,
        created_at: u.created_at
      }));
      if (typeof callback === 'function') callback(null, list);
      return;
    }

    // SELECT expenses by user_id
    if (q.includes('FROM expenses WHERE user_id = ?')) {
      const [userId] = params;
      const list = store.expenses
        .filter(e => e.user_id == userId)
        .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
      if (typeof callback === 'function') callback(null, list);
      return;
    }

    // SELECT group_splits by user_id
    if (q.includes('FROM group_splits WHERE user_id = ?')) {
      const [userId] = params;
      const list = store.group_splits.filter(s => s.user_id == userId);
      if (typeof callback === 'function') callback(null, list);
      return;
    }

    // SELECT subscriptions by user_id
    if (q.includes('FROM subscriptions WHERE user_id = ?')) {
      const [userId] = params;
      const list = store.subscriptions.filter(s => s.user_id == userId);
      if (typeof callback === 'function') callback(null, list);
      return;
    }

    // SELECT financial_goals by user_id
    if (q.includes('FROM financial_goals WHERE user_id = ?')) {
      const [userId] = params;
      const list = store.financial_goals.filter(g => g.user_id == userId);
      if (typeof callback === 'function') callback(null, list);
      return;
    }

    // SELECT credit_cards by user_id
    if (q.includes('FROM credit_cards WHERE user_id = ?')) {
      const [userId] = params;
      const list = store.credit_cards.filter(c => c.user_id == userId);
      if (typeof callback === 'function') callback(null, list);
      return;
    }

    if (typeof callback === 'function') callback(null, []);
  }
};

function syncBackupFromDb() {
  persistStore();
}

module.exports = {
  db,
  syncBackupFromDb
};
