const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { sendMaintenanceNotification } = require('../services/email');

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

// Shared SELECT: request row + property/unit/tenant display fields.
const REQ_SELECT = `
  SELECT m.*,
         p.title AS property_name,
         u.name  AS unit_name,
         t.full_name AS tenant_name, t.email AS tenant_email
  FROM maintenance_requests m
  LEFT JOIN properties p ON p.id = m.property_id
  LEFT JOIN units u      ON u.id = m.unit_id
  LEFT JOIN tenants t    ON t.id = m.tenant_id
`;

// Parse the stored photos JSON into an array (always returns an array).
function withPhotos(row) {
  if (!row) return row;
  let photos = [];
  if (row.photos) {
    try {
      photos = JSON.parse(row.photos);
    } catch (e) {
      photos = [];
    }
  }
  return { ...row, photos: Array.isArray(photos) ? photos : [] };
}

// List service requests for the authenticated user (optional ?status filter)
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { status } = req.query;
    let sql = `${REQ_SELECT} WHERE m.user_id = ?`;
    const params = [userId];
    if (status) {
      sql += ' AND m.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY m.created_at DESC';

    const [rows] = await pool.execute(sql, params);
    res.json(rows.map(withPhotos));
  } catch (error) {
    console.error('Get maintenance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single service request
router.get('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const [rows] = await pool.execute(
      `${REQ_SELECT} WHERE m.id = ? AND m.user_id = ?`,
      [req.params.id, userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Request not found' });
    res.json(withPhotos(rows[0]));
  } catch (error) {
    console.error('Get maintenance request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a service request — best-effort notification to the tenant.
router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { title, priority, propertyId, unitId, tenantId, category, photos } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Issue is required' });
    }
    if (!propertyId) {
      return res.status(400).json({ message: 'Property is required' });
    }

    const photosJson = JSON.stringify(Array.isArray(photos) ? photos.slice(0, 5) : []);

    const [result] = await pool.execute(
      `INSERT INTO maintenance_requests
        (user_id, property_id, unit_id, tenant_id, title, priority, category, photos, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_progress')`,
      [
        userId,
        propertyId,
        unitId || null,
        tenantId || null,
        title.trim(),
        priority || 'medium',
        category || null,
        photosJson,
      ]
    );

    // Human-friendly reference number derived from the row id.
    const reference = `SR-${4470 + result.insertId}`;
    await pool.execute('UPDATE maintenance_requests SET reference_number = ? WHERE id = ?', [
      reference,
      result.insertId,
    ]);

    const [created] = await pool.execute(`${REQ_SELECT} WHERE m.id = ?`, [result.insertId]);
    const request = withPhotos(created[0]);

    // Notify the tenant (non-blocking on failure).
    try {
      await sendMaintenanceNotification({ to: request.tenant_email, request });
    } catch (notifyErr) {
      console.error('Maintenance notification error:', notifyErr.message);
    }

    res.status(201).json(request);
  } catch (error) {
    console.error('Create maintenance request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a service request (status changes + edits)
router.put('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Load current row (so partial updates such as a status-only change keep
    // the other fields intact).
    const [existingRows] = await pool.execute(
      'SELECT * FROM maintenance_requests WHERE id = ? AND user_id = ?',
      [req.params.id, userId]
    );
    if (existingRows.length === 0) return res.status(404).json({ message: 'Request not found' });
    const cur = existingRows[0];

    const { title, priority, unitId, tenantId, category, status, photos } = req.body;
    const photosJson =
      photos !== undefined ? JSON.stringify(Array.isArray(photos) ? photos.slice(0, 5) : []) : cur.photos;

    await pool.execute(
      `UPDATE maintenance_requests SET
        title = ?, priority = ?, unit_id = ?, tenant_id = ?, category = ?, status = ?, photos = ?
       WHERE id = ? AND user_id = ?`,
      [
        title !== undefined ? title : cur.title,
        priority !== undefined ? priority : cur.priority,
        unitId !== undefined ? unitId || null : cur.unit_id,
        tenantId !== undefined ? tenantId || null : cur.tenant_id,
        category !== undefined ? category : cur.category,
        status !== undefined ? status : cur.status,
        photosJson,
        req.params.id,
        userId,
      ]
    );

    const [updated] = await pool.execute(`${REQ_SELECT} WHERE m.id = ?`, [req.params.id]);
    res.json(withPhotos(updated[0]));
  } catch (error) {
    console.error('Update maintenance request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a service request
router.delete('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    await pool.execute('DELETE FROM maintenance_requests WHERE id = ? AND user_id = ?', [
      req.params.id,
      userId,
    ]);
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Delete maintenance request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
