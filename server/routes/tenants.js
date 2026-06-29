const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../config/database');
const { sendInvite } = require('../services/email');

// Resolve the authenticated user id from the Bearer token.
function getUserId(req) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

// Shared SELECT: tenant row + property/unit display names + the most-recent
// active lease (drives "current rent" / term in the list & detail).
const TENANT_SELECT = `
  SELECT t.*,
         p.title AS property_name,
         u.name  AS unit_name,
         al.id            AS active_lease_id,
         al.annual_rent   AS current_rent,
         al.start_date    AS lease_start,
         al.lease_length  AS lease_length,
         al.payment_schedule AS payment_schedule
  FROM tenants t
  LEFT JOIN properties p ON p.id = t.property_id
  LEFT JOIN units u      ON u.id = t.unit_id
  LEFT JOIN (
    SELECT l1.* FROM leases l1
    JOIN (
      SELECT tenant_id, MAX(created_at) AS mx FROM leases
      WHERE status = 'active' GROUP BY tenant_id
    ) m ON m.tenant_id = l1.tenant_id AND m.mx = l1.created_at
  ) al ON al.tenant_id = t.id
`;

// List all tenants for the authenticated user
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const [tenants] = await pool.execute(
      `${TENANT_SELECT} WHERE t.owner_user_id = ? ORDER BY t.created_at DESC`,
      [userId]
    );
    res.json(tenants);
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single tenant (+ its leases for the detail Lease tab)
router.get('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const [tenants] = await pool.execute(
      `${TENANT_SELECT} WHERE t.id = ? AND t.owner_user_id = ?`,
      [req.params.id, userId]
    );
    if (tenants.length === 0) return res.status(404).json({ message: 'Tenant not found' });

    const tenant = tenants[0];
    const [leases] = await pool.execute(
      'SELECT * FROM leases WHERE tenant_id = ? AND user_id = ? ORDER BY created_at DESC',
      [req.params.id, userId]
    );
    tenant.leases = leases;

    res.json(tenant);
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a tenant — also provisions a tenant login account + sends an invite.
router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { fullName, email, phone, emiratesId, dob, propertyId, unitId } = req.body;

    if (!email || !phone || !emiratesId) {
      return res
        .status(400)
        .json({ message: 'Email, phone number and Emirates ID are required' });
    }

    // Insert the tenant record (pending until a lease is created).
    const [result] = await pool.execute(
      `INSERT INTO tenants
        (property_id, owner_user_id, full_name, email, phone, emirates_id, dob, unit_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        propertyId || null,
        userId,
        fullName || null,
        email,
        phone,
        emiratesId,
        dob || null,
        unitId || null,
      ]
    );
    const tenantId = result.insertId;

    // Provision / link a tenant login account with an auto-generated password.
    let rawPassword = null;
    try {
      const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
      let accountId;
      if (existing.length > 0) {
        accountId = existing[0].id; // reuse to avoid unique-email crash
      } else {
        rawPassword = crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
        const hashed = await bcrypt.hash(rawPassword, 10);
        const [userRes] = await pool.execute(
          `INSERT INTO users (email, password, full_name, phone, role)
           VALUES (?, ?, ?, ?, 'tenant')`,
          [email, hashed, fullName || email, phone || null]
        );
        accountId = userRes.insertId;
      }
      await pool.execute('UPDATE tenants SET user_id = ? WHERE id = ?', [accountId, tenantId]);

      // Only send an invite when we generated fresh credentials.
      if (rawPassword) {
        await sendInvite({ to: email, fullName, password: rawPassword });
      }
    } catch (acctErr) {
      // Account/email failures must never abort tenant creation.
      console.error('Tenant account provisioning error:', acctErr.message);
    }

    const [created] = await pool.execute(`${TENANT_SELECT} WHERE t.id = ?`, [tenantId]);
    res.status(201).json(created[0]);
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a tenant (edit modal) — does not touch the account or status.
router.put('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { fullName, email, phone, emiratesId, dob, propertyId, unitId } = req.body;

    await pool.execute(
      `UPDATE tenants SET
        full_name = ?, email = ?, phone = ?, emirates_id = ?, dob = ?,
        property_id = ?, unit_id = ?
       WHERE id = ? AND owner_user_id = ?`,
      [
        fullName || null,
        email || null,
        phone || null,
        emiratesId || null,
        dob || null,
        propertyId || null,
        unitId || null,
        req.params.id,
        userId,
      ]
    );

    const [updated] = await pool.execute(
      `${TENANT_SELECT} WHERE t.id = ? AND t.owner_user_id = ?`,
      [req.params.id, userId]
    );
    if (updated.length === 0) return res.status(404).json({ message: 'Tenant not found' });
    res.json(updated[0]);
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a tenant
router.delete('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    await pool.execute('DELETE FROM tenants WHERE id = ? AND owner_user_id = ?', [
      req.params.id,
      userId,
    ]);
    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
