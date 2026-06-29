const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, phone, businessName, address, city, emirate, role } = req.body;

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await pool.execute(
      'INSERT INTO users (email, password, full_name, phone, business_name, address, city, emirate, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, fullName, phone, businessName || null, address || null, city || null, emirate || null, role || 'landlord']
    );

    // Generate token
    const token = jwt.sign(
      { userId: result.insertId, email, role: role || 'landlord' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.insertId,
        email,
        fullName,
        phone,
        role: role || 'landlord'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const [users] = await pool.execute(
      `SELECT id, email, full_name, phone, role, emirates_id, dob, avatar_url,
              plan, billing_cycle, plan_started, created_at
       FROM users WHERE id = ?`,
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      role: user.role,
      emiratesId: user.emirates_id,
      dob: user.dob,
      avatarUrl: user.avatar_url,
      plan: user.plan,
      billingCycle: user.billing_cycle,
      planStarted: user.plan_started,
      createdAt: user.created_at
    });
  } catch (error) {
    // Invalid or expired token
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Resolve the authenticated user id from the Bearer token.
function getUserId(req) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET).userId;
  } catch (error) {
    return null;
  }
}

// Re-fetch + serialize the current user (shared by profile/billing updates).
async function serializeUser(id) {
  const [users] = await pool.execute(
    `SELECT id, email, full_name, phone, role, emirates_id, dob, avatar_url,
            plan, billing_cycle, plan_started, created_at
     FROM users WHERE id = ?`,
    [id]
  );
  if (users.length === 0) return null;
  const u = users[0];
  return {
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    phone: u.phone,
    role: u.role,
    emiratesId: u.emirates_id,
    dob: u.dob,
    avatarUrl: u.avatar_url,
    plan: u.plan,
    billingCycle: u.billing_cycle,
    planStarted: u.plan_started,
    createdAt: u.created_at,
  };
}

// Update profile (General information)
router.put('/profile', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { fullName, phone, emiratesId, dob, avatarUrl } = req.body;
    await pool.execute(
      `UPDATE users SET full_name = ?, phone = ?, emirates_id = ?, dob = ?, avatar_url = ?
       WHERE id = ?`,
      [
        fullName || null,
        phone || null,
        emiratesId || null,
        dob || null,
        avatarUrl !== undefined ? avatarUrl : null,
        userId,
      ]
    );
    res.json(await serializeUser(userId));
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password (Security)
router.post('/change-password', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const [users] = await pool.execute('SELECT password FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update billing plan (Billing)
router.put('/billing', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { plan, billingCycle } = req.body;
    await pool.execute(
      `UPDATE users SET plan = ?, billing_cycle = ?, plan_started = CURDATE() WHERE id = ?`,
      [plan || 'pro', billingCycle || 'monthly', userId]
    );
    res.json(await serializeUser(userId));
  } catch (error) {
    console.error('Update billing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
