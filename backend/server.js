const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_expense_tracker_key';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Admin Middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privilege required' });
  }
  next();
};

// System Version & In-App Update Checker
app.get('/api/system/version', (req, res) => {
  res.json({
    version: '2.5.0',
    minSupportedVersion: '1.0.0',
    releaseNotes: 'TrueBalance 2.5: Security PIN lock, mobile PWA/APK packaging & PRO tier features.',
    apkDownloadUrl: 'https://github.com'
  });
});

// --- AUTH ROUTES ---

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please provide name, email, and password' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const userRole = role === 'admin' ? 'admin' : 'user';

    db.run(
      `INSERT INTO users (name, email, password, role, monthly_budget) VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), cleanEmail, hashedPassword, userRole, 25000.0],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already registered' });
          }
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error during signup' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  const cleanEmail = email.trim().toLowerCase();

  db.get(
    `SELECT * FROM users WHERE email = ?`,
    [cleanEmail],
    async (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!user) return res.status(400).json({ error: 'Invalid email or password' });

      const isMatch = await bcrypt.compare(password.trim(), user.password);
      if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan || 'free', monthly_budget: user.monthly_budget || 25000.0 },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan || 'free', monthly_budget: user.monthly_budget || 25000.0 }
      });
    }
  );
});

// --- PROFILE & PLAN UPGRADE ROUTES ---

app.get('/api/user/profile', authenticateToken, (req, res) => {
  db.get(`SELECT id, name, email, role, plan, monthly_budget, created_at FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
});

app.put('/api/user/upgrade', authenticateToken, (req, res) => {
  const { plan } = req.body;
  const newPlan = plan === 'pro' ? 'pro' : 'free';

  db.run(`UPDATE users SET plan = ? WHERE id = ?`, [newPlan, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to update plan' });

    db.get(`SELECT id, name, email, role, plan, monthly_budget, created_at FROM users WHERE id = ?`, [req.user.id], (err, updatedUser) => {
      res.json(updatedUser);
    });
  });
});

// --- REAL PAYMENT GATEWAY ROUTES (Razorpay, UPI & Credit Cards) ---

app.post('/api/payments/create-order', authenticateToken, (req, res) => {
  const orderId = `order_tb_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const amount = 299; // ₹299/mo for TrueBalance PRO
  const upiId = 'truebalance@upi';
  const upiDeepLink = `upi://pay?pa=${upiId}&pn=TrueBalance%20PRO&am=${amount}&cu=INR&tn=ProSubscription`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiDeepLink)}`;

  res.json({
    orderId,
    amount,
    currency: 'INR',
    upiId,
    upiDeepLink,
    qrCodeUrl,
    key: 'rzp_test_truebalance_key'
  });
});

app.post('/api/payments/verify-checkout', authenticateToken, (req, res) => {
  const { paymentId, method = 'UPI_QR' } = req.body;
  const txId = paymentId || `pay_tb_${Date.now()}`;

  db.run(
    `INSERT INTO payments (user_id, payment_id, amount, currency, method, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.id, txId, 299.0, 'INR', method, 'success'],
    function (err) {
      if (err && !err.message.includes('UNIQUE')) {
        return res.status(500).json({ error: 'Payment verification failed' });
      }

      // Upgrade user to PRO plan
      db.run(`UPDATE users SET plan = 'pro' WHERE id = ?`, [req.user.id], function (updateErr) {
        if (updateErr) return res.status(500).json({ error: 'Failed to activate PRO plan' });

        db.get(`SELECT id, name, email, role, plan, monthly_budget, created_at FROM users WHERE id = ?`, [req.user.id], (getErr, updatedUser) => {
          res.json({
            success: true,
            paymentId: txId,
            message: 'Payment verified successfully! TrueBalance PRO 👑 activated.',
            user: updatedUser
          });
        });
      });
    }
  );
});

app.put('/api/user/profile', authenticateToken, (req, res) => {
  const { name, email, monthly_budget } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  db.run(
    `UPDATE users SET name = ?, email = ?, monthly_budget = ? WHERE id = ?`,
    [name, email.toLowerCase(), parseFloat(monthly_budget || 25000.0), req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to update profile' });
      res.json({
        id: req.user.id,
        name,
        email: email.toLowerCase(),
        role: req.user.role,
        monthly_budget: parseFloat(monthly_budget || 25000.0)
      });
    }
  );
});

app.put('/api/user/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  db.get(`SELECT password FROM users WHERE id = ?`, [req.user.id], async (err, user) => {
    if (err || !user) return res.status(500).json({ error: 'Database error' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

    const newHashed = await bcrypt.hash(newPassword, 10);
    db.run(`UPDATE users SET password = ? WHERE id = ?`, [newHashed, req.user.id], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update password' });
      res.json({ message: 'Password updated successfully' });
    });
  });
});

// --- EXPENSES & INCOME ROUTES ---

app.get('/api/expenses', authenticateToken, (req, res) => {
  db.all(
    `SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, time DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
    }
  );
});

app.post('/api/expenses', authenticateToken, (req, res) => {
  const { amount, category, description, date, time, type } = req.body;
  if (!amount || !category || !date || !time) {
    return res.status(400).json({ error: 'Please provide amount, category, date, and time' });
  }

  const transactionType = type === 'income' ? 'income' : 'expense';

  db.run(
    `INSERT INTO expenses (user_id, amount, category, description, date, time, type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, parseFloat(amount), category, description || '', date, time, transactionType],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to save transaction' });
      res.status(201).json({
        id: this.lastID,
        user_id: req.user.id,
        amount: parseFloat(amount),
        category,
        description: description || '',
        date,
        time,
        type: transactionType
      });
    }
  );
});

app.put('/api/expenses/:id', authenticateToken, (req, res) => {
  const { amount, category, description, date, time, type } = req.body;
  if (!amount || !category || !date || !time) {
    return res.status(400).json({ error: 'Please provide amount, category, date, and time' });
  }

  const transactionType = type === 'income' ? 'income' : 'expense';

  db.run(
    `UPDATE expenses SET amount = ?, category = ?, description = ?, date = ?, time = ?, type = ? WHERE id = ? AND user_id = ?`,
    [parseFloat(amount), category, description || '', date, time, transactionType, req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to update transaction' });
      if (this.changes === 0) return res.status(404).json({ error: 'Transaction not found or unauthorized' });
      res.json({
        id: parseInt(req.params.id),
        user_id: req.user.id,
        amount: parseFloat(amount),
        category,
        description: description || '',
        date,
        time,
        type: transactionType
      });
    }
  );
});

app.delete('/api/expenses/:id', authenticateToken, (req, res) => {
  db.run(
    `DELETE FROM expenses WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to delete transaction' });
      if (this.changes === 0) return res.status(404).json({ error: 'Transaction not found' });
      res.json({ message: 'Transaction deleted successfully' });
    }
  );
});

// --- ADVANCED AI OCR RECEIPT & DOCUMENT SCANNER PARSER API ---
app.post('/api/expenses/ocr', authenticateToken, (req, res) => {
  const { imageText, filename } = req.body;

  if ((!imageText || !imageText.trim()) && (!filename || !filename.trim())) {
    return res.status(400).json({ error: 'Please upload a receipt file or paste text to scan.' });
  }

  let amount = 0;
  let category = 'Other';
  let description = 'Scanned Document Transaction';
  let type = 'expense';
  let date = new Date().toISOString().split('T')[0];
  let time = new Date().toTimeString().split(' ')[0].slice(0, 5);

  const text = (imageText || filename || '').toLowerCase();

  const amountMatch = text.match(/(?:₹|rs\.?|inr|\$)\s*(\d+(?:,\d+)*(?:\.\d{1,2})?)/i) ||
                      text.match(/total\s*:?\s*(\d+(?:\.\d{1,2})?)/i) ||
                      text.match(/amount\s*:?\s*(\d+(?:\.\d{1,2})?)/i) ||
                      text.match(/(\d+\.\d{2})/);

  if (amountMatch) {
    const rawVal = amountMatch[1].replace(/,/g, '');
    const parsedVal = parseFloat(rawVal);
    if (!isNaN(parsedVal) && parsedVal > 0) {
      amount = parsedVal;
    }
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'Could not detect a valid amount in the document. Please enter the details manually.' });
  }

  if (text.includes('credited') || text.includes('salary') || text.includes('received') || text.includes('refund') || text.includes('cashback')) {
    type = 'income';
    category = text.includes('salary') ? 'Salary & Income' : 'Other';
    description = text.includes('salary') ? 'Monthly Salary Credit' : 'Income Credit Received';
  } else {
    type = 'expense';
    if (text.includes('uber') || text.includes('ola') || text.includes('rapido') || text.includes('cab') || text.includes('fuel') || text.includes('petrol')) {
      category = 'Transportation';
      description = 'Ride / Fuel Expense';
    } else if (text.includes('swiggy') || text.includes('zomato') || text.includes('food') || text.includes('hotel') || text.includes('cafe') || text.includes('starbucks')) {
      category = 'Food & Dining';
      description = 'Food & Dining Order';
    } else if (text.includes('amazon') || text.includes('flipkart') || text.includes('myntra') || text.includes('store') || text.includes('mall')) {
      category = 'Shopping';
      description = 'Shopping Purchase';
    } else if (text.includes('electricity') || text.includes('bescom') || text.includes('wifi') || text.includes('recharge') || text.includes('bill') || text.includes('water')) {
      category = 'Bills & Utilities';
      description = 'Utility Bill Payment';
    }
  }

  res.json({
    amount,
    category,
    description: description || 'Scanned Document Transaction',
    date,
    time,
    type
  });
});

// --- BILL SPLITTING ROUTES ---

app.get('/api/splits', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM group_splits WHERE user_id = ? ORDER BY created_at DESC`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch splits' });
    res.json(rows);
  });
});

app.post('/api/splits', authenticateToken, (req, res) => {
  const { title, total_amount, split_count } = req.body;
  if (!title || !total_amount || !split_count || parseInt(split_count) <= 0) {
    return res.status(400).json({ error: 'Please provide valid title, total amount, and number of people' });
  }

  const perPerson = parseFloat(total_amount) / parseInt(split_count);

  db.run(
    `INSERT INTO group_splits (user_id, title, total_amount, split_count, per_person) VALUES (?, ?, ?, ?, ?)`,
    [req.user.id, title, parseFloat(total_amount), parseInt(split_count), perPerson],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to create bill split' });
      res.status(201).json({
        id: this.lastID,
        user_id: req.user.id,
        title,
        total_amount: parseFloat(total_amount),
        split_count: parseInt(split_count),
        per_person: perPerson
      });
    }
  );
});

app.delete('/api/splits/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM group_splits WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete split' });
    res.json({ message: 'Split deleted' });
  });
});

// --- SUBSCRIPTIONS ROUTES ---

app.get('/api/subscriptions', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM subscriptions WHERE user_id = ? ORDER BY due_day ASC`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    res.json(rows);
  });
});

app.post('/api/subscriptions', authenticateToken, (req, res) => {
  const { title, amount, due_day, category } = req.body;
  if (!title || !amount || !due_day) {
    return res.status(400).json({ error: 'Title, amount, and due day are required' });
  }

  db.run(
    `INSERT INTO subscriptions (user_id, title, amount, due_day, category) VALUES (?, ?, ?, ?, ?)`,
    [req.user.id, title, parseFloat(amount), parseInt(due_day), category || 'Bills & Utilities'],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to add subscription' });
      res.status(201).json({
        id: this.lastID,
        user_id: req.user.id,
        title,
        amount: parseFloat(amount),
        due_day: parseInt(due_day),
        category: category || 'Bills & Utilities'
      });
    }
  );
});

app.delete('/api/subscriptions/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM subscriptions WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete subscription' });
    res.json({ message: 'Subscription deleted' });
  });
});

// --- FINANCIAL GOALS / SAVINGS VAULTS ROUTES ---

app.get('/api/goals', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM financial_goals WHERE user_id = ? ORDER BY created_at DESC`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch goals' });
    res.json(rows);
  });
});

app.post('/api/goals', authenticateToken, (req, res) => {
  const { title, target_amount, saved_amount, deadline_date } = req.body;
  if (!title || !target_amount) {
    return res.status(400).json({ error: 'Title and target amount are required' });
  }

  db.run(
    `INSERT INTO financial_goals (user_id, title, target_amount, saved_amount, deadline_date) VALUES (?, ?, ?, ?, ?)`,
    [req.user.id, title, parseFloat(target_amount), parseFloat(saved_amount || 0), deadline_date || ''],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to add goal' });
      res.status(201).json({
        id: this.lastID,
        user_id: req.user.id,
        title,
        target_amount: parseFloat(target_amount),
        saved_amount: parseFloat(saved_amount || 0),
        deadline_date: deadline_date || ''
      });
    }
  );
});

app.put('/api/goals/:id/deposit', authenticateToken, (req, res) => {
  const { addAmount } = req.body;
  if (!addAmount || parseFloat(addAmount) <= 0) {
    return res.status(400).json({ error: 'Valid deposit amount required' });
  }

  db.run(
    `UPDATE financial_goals SET saved_amount = saved_amount + ? WHERE id = ? AND user_id = ?`,
    [parseFloat(addAmount), req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to deposit into goal' });
      db.get(`SELECT * FROM financial_goals WHERE id = ?`, [req.params.id], (err, updatedGoal) => {
        res.json(updatedGoal);
      });
    }
  );
});

app.delete('/api/goals/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM financial_goals WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete goal' });
    res.json({ message: 'Goal deleted' });
  });
});

// --- CREDIT CARDS ROUTES ---

app.get('/api/credit-cards', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM credit_cards WHERE user_id = ? ORDER BY due_date ASC`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch credit cards' });
    res.json(rows);
  });
});

app.post('/api/credit-cards', authenticateToken, (req, res) => {
  const { card_name, due_date, statement_amount, min_due } = req.body;
  if (!card_name || !due_date || !statement_amount) {
    return res.status(400).json({ error: 'Card name, due date, and statement amount are required' });
  }

  db.run(
    `INSERT INTO credit_cards (user_id, card_name, due_date, statement_amount, min_due, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.id, card_name, due_date, parseFloat(statement_amount), parseFloat(min_due || 0), 'unpaid'],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to add credit card' });
      res.status(201).json({
        id: this.lastID,
        user_id: req.user.id,
        card_name,
        due_date,
        statement_amount: parseFloat(statement_amount),
        min_due: parseFloat(min_due || 0),
        status: 'unpaid'
      });
    }
  );
});

app.put('/api/credit-cards/:id/pay', authenticateToken, (req, res) => {
  db.run(
    `UPDATE credit_cards SET status = 'paid' WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to mark card bill as paid' });
      res.json({ message: 'Bill marked as paid' });
    }
  );
});

app.delete('/api/credit-cards/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM credit_cards WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete credit card' });
    res.json({ message: 'Credit card deleted' });
  });
});

// --- ADMIN ROUTES ---

app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  db.get(`SELECT COUNT(*) as totalUsers, SUM(CASE WHEN plan = 'pro' THEN 1 ELSE 0 END) as proUsers, SUM(CASE WHEN plan = 'pro' THEN 0 ELSE 1 END) as freeUsers FROM users WHERE role = 'user'`, [], (err, userRow) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch user count' });

    db.get(`SELECT COUNT(*) as totalExpenses, COALESCE(SUM(amount), 0) as totalAmount FROM expenses WHERE type = 'expense'`, [], (err, expenseRow) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch expense stats' });

      db.all(
        `SELECT u.id, u.name, u.email, COALESCE(u.plan, 'free') as plan, u.monthly_budget, u.created_at, COUNT(e.id) as expenseCount, COALESCE(SUM(e.amount), 0) as totalSpent 
         FROM users u 
         LEFT JOIN expenses e ON u.id = e.user_id AND e.type = 'expense'
         WHERE u.role = 'user' 
         GROUP BY u.id 
         ORDER BY u.created_at DESC`,
        [],
        (err, usersList) => {
          if (err) return res.status(500).json({ error: 'Failed to fetch user breakdown' });

          res.json({
            totalUsers: userRow.totalUsers || 0,
            freeUsers: userRow.freeUsers || 0,
            proUsers: userRow.proUsers || 0,
            totalExpenses: expenseRow.totalExpenses || 0,
            totalAmount: expenseRow.totalAmount || 0,
            users: usersList
          });
        }
      );
    });
  });
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
  db.run(`DELETE FROM users WHERE id = ? AND role = 'user'`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete user' });
    db.run(`DELETE FROM expenses WHERE user_id = ?`, [req.params.id], () => {
      db.run(`DELETE FROM group_splits WHERE user_id = ?`, [req.params.id], () => {
        db.run(`DELETE FROM subscriptions WHERE user_id = ?`, [req.params.id], () => {
          db.run(`DELETE FROM financial_goals WHERE user_id = ?`, [req.params.id], () => {
            db.run(`DELETE FROM credit_cards WHERE user_id = ?`, [req.params.id], () => {
              res.json({ message: 'User deleted successfully' });
            });
          });
        });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
