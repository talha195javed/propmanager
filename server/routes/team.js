const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

function getUserId(req) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET).userId;
  } catch (error) {
    return null;
  }
}

// Permission matrix entities (mirrored on the frontend).
const ENTITIES = [
  'dashboard', 'owners', 'tenants', 'lease', 'payments',
  'maintenance', 'tasks', 'message', 'roles',
];

// Default permission matrix for an admin type.
function defaultPermissions(adminType) {
  const all = adminType === 'super_admin';
  const perms = {};
  for (const e of ENTITIES) {
    perms[e] = { read: true, create: all, edit: all, delete: all };
  }
  return perms;
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
}

function serialize(row) {
  return {
    ...row,
    permissions: parseJson(row.permissions, {}),
    property_permissions: parseJson(row.property_permissions, {}),
  };
}

// List team members
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const [rows] = await pool.execute(
      'SELECT * FROM team_members WHERE owner_user_id = ? ORDER BY created_at ASC',
      [userId]
    );
    res.json(rows.map(serialize));
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get one
router.get('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const [rows] = await pool.execute(
      'SELECT * FROM team_members WHERE id = ? AND owner_user_id = ?',
      [req.params.id, userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Member not found' });
    res.json(serialize(rows[0]));
  } catch (error) {
    console.error('Get team member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create
router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { fullName, email, phone, emiratesId, dob, adminType, status } = req.body;
    if (!fullName || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const type = ['super_admin', 'view_only', 'custom'].includes(adminType)
      ? adminType
      : 'view_only';
    const perms = JSON.stringify(defaultPermissions(type));

    const [result] = await pool.execute(
      `INSERT INTO team_members
        (owner_user_id, full_name, email, phone, emirates_id, dob, admin_type, status, permissions, property_permissions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '{}')`,
      [
        userId,
        fullName,
        email,
        phone || null,
        emiratesId || null,
        dob || null,
        type,
        status || 'active',
        perms,
      ]
    );

    const [created] = await pool.execute('SELECT * FROM team_members WHERE id = ?', [result.insertId]);
    res.status(201).json(serialize(created[0]));
  } catch (error) {
    console.error('Create team member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update (admin type, status, permission matrix, property permissions)
router.put('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const [existing] = await pool.execute(
      'SELECT * FROM team_members WHERE id = ? AND owner_user_id = ?',
      [req.params.id, userId]
    );
    if (existing.length === 0) return res.status(404).json({ message: 'Member not found' });
    const cur = existing[0];

    const { fullName, email, phone, emiratesId, dob, adminType, status, permissions, propertyPermissions } = req.body;

    // Switching admin type to super/view resets the matrix to its defaults,
    // unless an explicit matrix is supplied.
    let permsJson = cur.permissions;
    if (permissions !== undefined) {
      permsJson = JSON.stringify(permissions);
    } else if (adminType && adminType !== cur.admin_type && adminType !== 'custom') {
      permsJson = JSON.stringify(defaultPermissions(adminType));
    }

    await pool.execute(
      `UPDATE team_members SET
        full_name = ?, email = ?, phone = ?, emirates_id = ?, dob = ?,
        admin_type = ?, status = ?, permissions = ?, property_permissions = ?
       WHERE id = ? AND owner_user_id = ?`,
      [
        fullName !== undefined ? fullName : cur.full_name,
        email !== undefined ? email : cur.email,
        phone !== undefined ? phone : cur.phone,
        emiratesId !== undefined ? emiratesId : cur.emirates_id,
        dob !== undefined ? dob : cur.dob,
        adminType || cur.admin_type,
        status || cur.status,
        permsJson,
        propertyPermissions !== undefined ? JSON.stringify(propertyPermissions) : cur.property_permissions,
        req.params.id,
        userId,
      ]
    );

    const [updated] = await pool.execute('SELECT * FROM team_members WHERE id = ?', [req.params.id]);
    res.json(serialize(updated[0]));
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    await pool.execute('DELETE FROM team_members WHERE id = ? AND owner_user_id = ?', [
      req.params.id,
      userId,
    ]);
    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
