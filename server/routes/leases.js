const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

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

// Shared SELECT: lease row + party/property/unit display fields.
const LEASE_SELECT = `
  SELECT l.*,
         t.full_name AS tenant_name, t.email AS tenant_email,
         p.title AS property_name,
         u.name AS unit_name, u.unit_type, u.size_sqft, u.market_rent,
         u.bedrooms, u.bathrooms, u.status AS unit_status,
         o.full_name AS landlord_name, o.company AS landlord_company
  FROM leases l
  LEFT JOIN tenants t    ON t.id = l.tenant_id
  LEFT JOIN properties p ON p.id = l.property_id
  LEFT JOIN units u      ON u.id = l.unit_id
  LEFT JOIN owners o     ON o.id = l.landlord_owner_id
`;

// List leases for the authenticated user (optional ?status=active filter)
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { status } = req.query;
    let sql = `${LEASE_SELECT} WHERE l.user_id = ?`;
    const params = [userId];
    if (status) {
      sql += ' AND l.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY l.created_at DESC';

    const [leases] = await pool.execute(sql, params);
    res.json(leases);
  } catch (error) {
    console.error('Get leases error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single lease (powers the Lease detail page)
router.get('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const [leases] = await pool.execute(
      `${LEASE_SELECT} WHERE l.id = ? AND l.user_id = ?`,
      [req.params.id, userId]
    );
    if (leases.length === 0) return res.status(404).json({ message: 'Lease not found' });
    res.json(leases[0]);
  } catch (error) {
    console.error('Get lease error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a lease — activates the tenant and marks the unit occupied.
router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const {
      region, landlordOwnerId, tenantId, propertyId, unitId,
      leaseType, leaseLength, startDate, rentalInvoiceDate,
      annualRent, paymentSchedule, securityDeposit, keyDeposit, clauses,
    } = req.body;

    if (!tenantId || !propertyId) {
      return res.status(400).json({ message: 'Tenant and property are required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO leases
        (user_id, region, landlord_owner_id, tenant_id, property_id, unit_id,
         lease_type, lease_length, start_date, rental_invoice_date,
         annual_rent, payment_schedule, security_deposit, key_deposit, clauses, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        userId,
        region || null,
        landlordOwnerId || null,
        tenantId,
        propertyId,
        unitId || null,
        leaseType || 'Yearly',
        leaseLength || null,
        startDate || null,
        rentalInvoiceDate || null,
        annualRent ? Number(annualRent) : null,
        paymentSchedule || null,
        securityDeposit ? Number(securityDeposit) : null,
        keyDeposit ? Number(keyDeposit) : null,
        clauses || null,
      ]
    );

    // Tenant becomes active; the linked unit becomes occupied.
    await pool.execute(
      `UPDATE tenants SET status = 'active' WHERE id = ? AND owner_user_id = ?`,
      [tenantId, userId]
    );
    if (unitId) {
      await pool.execute(`UPDATE units SET status = 'occupied' WHERE id = ?`, [unitId]);
    }

    const [created] = await pool.execute(`${LEASE_SELECT} WHERE l.id = ?`, [result.insertId]);
    res.status(201).json(created[0]);
  } catch (error) {
    console.error('Create lease error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a lease
router.put('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const {
      region, landlordOwnerId, leaseType, leaseLength, startDate, rentalInvoiceDate,
      annualRent, paymentSchedule, securityDeposit, keyDeposit, clauses, status,
    } = req.body;

    await pool.execute(
      `UPDATE leases SET
        region = ?, landlord_owner_id = ?, lease_type = ?, lease_length = ?,
        start_date = ?, rental_invoice_date = ?, annual_rent = ?, payment_schedule = ?,
        security_deposit = ?, key_deposit = ?, clauses = ?, status = ?
       WHERE id = ? AND user_id = ?`,
      [
        region || null,
        landlordOwnerId || null,
        leaseType || 'Yearly',
        leaseLength || null,
        startDate || null,
        rentalInvoiceDate || null,
        annualRent ? Number(annualRent) : null,
        paymentSchedule || null,
        securityDeposit ? Number(securityDeposit) : null,
        keyDeposit ? Number(keyDeposit) : null,
        clauses || null,
        status || 'active',
        req.params.id,
        userId,
      ]
    );

    const [updated] = await pool.execute(
      `${LEASE_SELECT} WHERE l.id = ? AND l.user_id = ?`,
      [req.params.id, userId]
    );
    if (updated.length === 0) return res.status(404).json({ message: 'Lease not found' });
    res.json(updated[0]);
  } catch (error) {
    console.error('Update lease error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a lease
router.delete('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    await pool.execute('DELETE FROM leases WHERE id = ? AND user_id = ?', [
      req.params.id,
      userId,
    ]);
    res.json({ message: 'Lease deleted successfully' });
  } catch (error) {
    console.error('Delete lease error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
