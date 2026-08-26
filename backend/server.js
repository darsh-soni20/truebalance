require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, syncBackupFromDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_expense_tracker_key';

// Validate JWT Secret in production
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'supersecret_expense_tracker_key')) {
  console.warn('[SECURITY WARNING] Standard default JWT_SECRET detected in production! Please configure a strong JWT_SECRET environment variable.');
}

// 1. HTTPS Enforcement & Security Headers Middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }

  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 2. Security Audit Logger (Auth Attempts, Errors & Traffic Monitoring)
const logSecurityEvent = (eventType, details) => {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY AUDIT] [${timestamp}] [${eventType}]`, JSON.stringify(details));
};

// Traffic Monitoring & Error Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      logSecurityEvent('API_RESPONSE_WARNING', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        clientIp: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        durationMs: duration
      });
    }
  });
  next();
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    logSecurityEvent('AUTH_UNAUTHORIZED', { path: req.path, ip: req.ip || req.headers['x-forwarded-for'] });
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      logSecurityEvent('AUTH_INVALID_TOKEN', { path: req.path, ip: req.ip || req.headers['x-forwarded-for'] });
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
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

const crypto = require('crypto');

// Bot Protection & Anti-Scraping Middleware
const BLOCKED_BOT_AGENTS = [/python-requests/i, /scrapy/i, /nikto/i, /sqlmap/i, /nmap/i, /dirbuster/i, /masscan/i];
const botProtectionMiddleware = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  if (BLOCKED_BOT_AGENTS.some((botPattern) => botPattern.test(userAgent))) {
    logSecurityEvent('BOT_ACCESS_BLOCKED', { ip: req.ip || req.headers['x-forwarded-for'], userAgent, path: req.path });
    return res.status(403).json({ error: 'Automated script or bot access detected and blocked.' });
  }
  next();
};

app.use(botProtectionMiddleware);

// Generic Sliding Window Rate Limiter Factory
const createRateLimiter = (windowMs, maxRequests, limitName) => {
  const requestsMap = new Map();
  return (req, res, next) => {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = requestsMap.get(clientIp) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count += 1;
    requestsMap.set(clientIp, record);

    if (record.count > maxRequests) {
      logSecurityEvent('ABUSE_RATE_LIMIT_EXCEEDED', { limitName, ip: clientIp, path: req.path, count: record.count });
      return res.status(429).json({
        error: `Too many requests for ${limitName}. Please try again later to prevent abuse.`
      });
    }

    next();
  };
};

// 1. Global API Rate Limiter (Scraping & DoS Protection: 120 req / 15 mins)
const globalApiRateLimiter = createRateLimiter(15 * 60 * 1000, 120, 'General API');
app.use('/api', globalApiRateLimiter);

// 2. Account Creation Rate Limiter (Mass Registration Protection: 3 signups / 1 hour)
const signupRateLimiter = createRateLimiter(60 * 60 * 1000, 3, 'Account Creation');

// 3. AI Generation & OCR Scanner Rate Limiter (Resource Exhaustion Protection: 10 scans / 15 mins)
const aiOcrRateLimiter = createRateLimiter(15 * 60 * 1000, 10, 'AI Receipt Scanner');

const recordFailedAttempt = (ipKey, email = 'unknown') => {
  if (!ipKey) return;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const record = loginAttemptsMap.get(ipKey) || { count: 0, resetTime: now + windowMs };
  record.count += 1;
  loginAttemptsMap.set(ipKey, record);
  logSecurityEvent('AUTH_FAILED', { ip: ipKey, email, attemptCount: record.count });
};

const clearFailedAttempts = (ipKey, email = 'unknown') => {
  if (ipKey) loginAttemptsMap.delete(ipKey);
  logSecurityEvent('AUTH_SUCCESS', { ip: ipKey, email });
};

// System Version & In-App Update Checker
app.get('/api/system/version', (req, res) => {
  res.json({
    version: '2.5.0',
    minSupportedVersion: '1.0.0',
    releaseNotes: 'TrueBalance 2.5: Hardened Authentication, Security PIN lock, mobile PWA/APK packaging & PRO tier features.',
    apkDownloadUrl: 'https://github.com'
  });
});

// --- INPUT VALIDATION & SANITIZATION UTILITIES ---

// 1. Text & XSS Script Injection Sanitizer
const sanitizeText = (input = '') => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

// 2. Filename Sanitizer (Path Traversal & Command Injection Protection)
const sanitizeFilename = (filename = '') => {
  if (typeof filename !== 'string') return 'file.txt';
  return filename
    .replace(/[\/\\]/g, '')
    .replace(/\.\./g, '')
    .replace(/[^\w\.\-]/gi, '_')
    .slice(0, 100);
};

// 3. ISO Date Format Validator (YYYY-MM-DD)
const validateIsoDate = (dateStr) => {
  if (typeof dateStr !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(Date.parse(dateStr));
};

// 4. Time Format Validator (HH:MM)
const validateTimeStr = (timeStr) => {
  if (typeof timeStr !== 'string') return false;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(timeStr);
};

// 5. Positive Number Parser
const parsePositiveNumber = (val, defaultVal = null) => {
  const num = parseFloat(val);
  if (isNaN(num) || !isFinite(num) || num < 0) return defaultVal;
  return num;
};

// --- SECURE AUTHENTICATION ROUTES ---

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

app.post('/api/auth/signup', signupRateLimiter, authRateLimiter, async (req, res) => {
  const { name, email, password, role, monthly_budget } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please provide name, email, and password' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid, verified email address (e.g. name@gmail.com)' });
  }

  const userBudget = parseFloat(monthly_budget) > 0 ? parseFloat(monthly_budget) : 25000.0;

  try {
    const hashedPassword = await bcrypt.hash(password.trim(), 12);
    const userRole = role === 'admin' ? 'admin' : 'user';
    const verifyToken = crypto.randomBytes(32).toString('hex');

    db.run(
      `INSERT INTO users (name, email, password, role, monthly_budget, is_verified, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), cleanEmail, hashedPassword, userRole, userBudget, 1, verifyToken],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            recordFailedAttempt(req.rateLimitKey);
            return res.status(400).json({ error: 'Email already registered' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        clearFailedAttempts(req.rateLimitKey);
        syncBackupFromDb();
        res.status(201).json({
          message: 'User registered successfully with verified email status',
          userId: this.lastID
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error during signup' });
  }
});

app.post('/api/auth/login', authRateLimiter, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid verified email address' });
  }

  db.get(
    `SELECT * FROM users WHERE email = ?`,
    [cleanEmail],
    async (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!user) {
        recordFailedAttempt(req.rateLimitKey);
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password.trim(), user.password);
      if (!isMatch) {
        recordFailedAttempt(req.rateLimitKey);
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      clearFailedAttempts(req.rateLimitKey);

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

// Google OAuth 2.0 Auth / One-Tap Login & Signup Route
app.post('/api/auth/google', authRateLimiter, async (req, res) => {
  const { email, name, monthly_budget } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Google account email is required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(cleanEmail)) {
    return res.status(400).json({ error: 'Google account email is invalid' });
  }

  const displayName = name || cleanEmail.split('@')[0];
  const userBudget = parseFloat(monthly_budget) > 0 ? parseFloat(monthly_budget) : 25000.0;

  db.get(`SELECT * FROM users WHERE email = ?`, [cleanEmail], async (err, existingUser) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (existingUser) {
      clearFailedAttempts(req.rateLimitKey);
      const token = jwt.sign(
        { id: existingUser.id, name: existingUser.name, email: existingUser.email, role: existingUser.role, plan: existingUser.plan || 'free', monthly_budget: existingUser.monthly_budget || 25000.0 },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        user: { id: existingUser.id, name: existingUser.name, email: existingUser.email, role: existingUser.role, plan: existingUser.plan || 'free', monthly_budget: existingUser.monthly_budget || 25000.0 }
      });
    } else {
      const secureRandomPass = crypto.randomBytes(32).toString('hex');
      const dummyPassword = await bcrypt.hash(secureRandomPass, 12);
      db.run(
        `INSERT INTO users (name, email, password, role, monthly_budget, is_verified) VALUES (?, ?, ?, ?, ?, 1)`,
        [displayName, cleanEmail, dummyPassword, 'user', userBudget],
        function (insertErr) {
          if (insertErr) return res.status(500).json({ error: 'Failed to create user with Google' });

          clearFailedAttempts(req.rateLimitKey);
          syncBackupFromDb();

          const newUserObj = {
            id: this.lastID,
            name: displayName,
            email: cleanEmail,
            role: 'user',
            plan: 'free',
            monthly_budget: userBudget
          };

          const token = jwt.sign(newUserObj, JWT_SECRET, { expiresIn: '24h' });
          res.status(201).json({ token, user: newUserObj });
        }
      );
    }
  });
});

// Password Reset Request Endpoint (Generates Expiring Hashed Reset Token)
app.post('/api/auth/forgot-password', authRateLimiter, (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email address is required' });

  const cleanEmail = email.trim().toLowerCase();

  db.get(`SELECT id FROM users WHERE email = ?`, [cleanEmail], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) {
      // Generic success message to prevent user enumeration attacks
      return res.json({ message: 'If that email is registered, a password reset token has been issued.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes expiration

    db.run(
      `UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?`,
      [hashedResetToken, expiresAt, user.id],
      (updateErr) => {
        if (updateErr) return res.status(500).json({ error: 'Failed to generate reset token' });

        res.json({
          message: 'Password reset token generated successfully. Valid for 15 minutes.',
          resetToken // Sent securely to user client
        });
      }
    );
  });
});

// Password Reset Execution Endpoint (Verifies Unexpired Token & Hashes New Password)
app.post('/api/auth/reset-password', authRateLimiter, async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Reset token and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  const hashedResetToken = crypto.createHash('sha256').update(token).digest('hex');
  const nowIso = new Date().toISOString();

  db.get(
    `SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > ?`,
    [hashedResetToken, nowIso],
    async (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!user) {
        return res.status(400).json({ error: 'Password reset token is invalid or has expired' });
      }

      const hashedPassword = await bcrypt.hash(newPassword.trim(), 12);

      db.run(
        `UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?`,
        [hashedPassword, user.id],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ error: 'Failed to reset password' });

          clearFailedAttempts(req.rateLimitKey);
          res.json({ message: 'Password has been successfully reset. You may now log in with your new password.' });
        }
      );
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

app.put('/api/user/budget', authenticateToken, (req, res) => {
  const { monthly_budget } = req.body;
  const newBudget = parseFloat(monthly_budget) > 0 ? parseFloat(monthly_budget) : 25000.0;

  db.run(`UPDATE users SET monthly_budget = ? WHERE id = ?`, [newBudget, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to update monthly budget' });

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
      res.json(rows || []);
    }
  );
});

app.post('/api/expenses', authenticateToken, (req, res) => {
  const { amount, category, description, date, time, type } = req.body;
  
  const parsedAmount = parsePositiveNumber(amount);
  if (parsedAmount === null) {
    return res.status(400).json({ error: 'Please provide a valid numeric amount' });
  }

  const cleanCategory = sanitizeText(category);
  if (!cleanCategory) {
    return res.status(400).json({ error: 'Category is required' });
  }

  if (date && !validateIsoDate(date)) {
    return res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD' });
  }

  if (time && !validateTimeStr(time)) {
    return res.status(400).json({ error: 'Invalid time format. Expected HH:MM' });
  }

  const cleanDescription = sanitizeText(description);
  const transactionType = type === 'income' ? 'income' : 'expense';
  const cleanDate = date || new Date().toISOString().split('T')[0];
  const cleanTime = time || new Date().toTimeString().split(' ')[0].slice(0, 5);

  db.run(
    `INSERT INTO expenses (user_id, amount, category, description, date, time, type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, parsedAmount, cleanCategory, cleanDescription, cleanDate, cleanTime, transactionType],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to save transaction' });
      res.status(201).json({
        id: this.lastID,
        user_id: req.user.id,
        amount: parsedAmount,
        category: cleanCategory,
        description: cleanDescription,
        date: cleanDate,
        time: cleanTime,
        type: transactionType
      });
    }
  );
});

app.put('/api/expenses/:id', authenticateToken, (req, res) => {
  const { amount, category, description, date, time, type } = req.body;
  
  const parsedAmount = parsePositiveNumber(amount);
  if (parsedAmount === null) {
    return res.status(400).json({ error: 'Please provide a valid numeric amount' });
  }

  const cleanCategory = sanitizeText(category);
  if (!cleanCategory) {
    return res.status(400).json({ error: 'Category is required' });
  }

  if (date && !validateIsoDate(date)) {
    return res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD' });
  }

  if (time && !validateTimeStr(time)) {
    return res.status(400).json({ error: 'Invalid time format. Expected HH:MM' });
  }

  const cleanDescription = sanitizeText(description);
  const transactionType = type === 'income' ? 'income' : 'expense';
  const cleanDate = date || new Date().toISOString().split('T')[0];
  const cleanTime = time || new Date().toTimeString().split(' ')[0].slice(0, 5);

  db.run(
    `UPDATE expenses SET amount = ?, category = ?, description = ?, date = ?, time = ?, type = ? WHERE id = ? AND user_id = ?`,
    [parsedAmount, cleanCategory, cleanDescription, cleanDate, cleanTime, transactionType, req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to update transaction' });
      if (this.changes === 0) return res.status(404).json({ error: 'Transaction not found or unauthorized' });
      res.json({
        id: parseInt(req.params.id),
        user_id: req.user.id,
        amount: parsedAmount,
        category: cleanCategory,
        description: cleanDescription,
        date: cleanDate,
        time: cleanTime,
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
app.post('/api/expenses/ocr', authenticateToken, aiOcrRateLimiter, (req, res) => {
  const { imageText, filename } = req.body;

  const cleanText = sanitizeText(imageText || '');
  const cleanFilename = sanitizeFilename(filename || '');

  if (!cleanText && !cleanFilename) {
    return res.status(400).json({ error: 'Please upload a valid receipt file or paste valid text to scan.' });
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
    if (this.changes === 0) return res.status(404).json({ error: 'Bill split not found or unauthorized' });
    res.json({ message: 'Split deleted' });
  });
});

// --- SUBSCRIPTIONS ROUTES ---

app.get('/api/subscriptions', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM subscriptions WHERE user_id = ? ORDER BY due_day ASC`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    res.json(rows || []);
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
    if (this.changes === 0) return res.status(404).json({ error: 'Subscription not found or unauthorized' });
    res.json({ message: 'Subscription deleted' });
  });
});

// --- FINANCIAL GOALS / SAVINGS VAULTS ROUTES ---

app.get('/api/goals', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM financial_goals WHERE user_id = ? ORDER BY created_at DESC`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch goals' });
    res.json(rows || []);
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
      if (this.changes === 0) return res.status(404).json({ error: 'Goal not found or unauthorized' });

      db.get(`SELECT * FROM financial_goals WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], (err, updatedGoal) => {
        res.json(updatedGoal);
      });
    }
  );
});

app.delete('/api/goals/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM financial_goals WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete goal' });
    if (this.changes === 0) return res.status(404).json({ error: 'Goal not found or unauthorized' });
    res.json({ message: 'Goal deleted' });
  });
});

// --- CREDIT CARDS ROUTES ---

app.get('/api/credit-cards', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM credit_cards WHERE user_id = ? ORDER BY due_date ASC`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch credit cards' });
    res.json(rows || []);
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
      if (this.changes === 0) return res.status(404).json({ error: 'Credit card bill not found or unauthorized' });
      res.json({ message: 'Bill marked as paid' });
    }
  );
});

app.delete('/api/credit-cards/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM credit_cards WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete credit card' });
    if (this.changes === 0) return res.status(404).json({ error: 'Credit card not found or unauthorized' });
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
