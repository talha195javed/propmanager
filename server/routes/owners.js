const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Resolve the authenticated user id from the Bearer token.
// Returns null (and the caller responds 401) when the token is missing/invalid.
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

// Get all owners for the authenticated user (with a count of linked properties)
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const [owners] = await pool.execute(
      `SELECT o.*,
              (SELECT COUNT(*) FROM owner_properties op WHERE op.owner_id = o.id) AS properties_owned
       FROM owners o
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );

    res.json(owners);
  } catch (error) {
    console.error('Get owners error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single owner
router.get('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const [owners] = await pool.execute(
      'SELECT * FROM owners WHERE id = ? AND user_id = ?',
      [req.params.id, userId]
    );

    if (owners.length === 0) {
      return res.status(404).json({ message: 'Owner not found' });
    }

    res.json(owners[0]);
  } catch (error) {
    console.error('Get owner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create an owner
router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const {
      fullName, email, phone, addressLine, city, emirate,
      company, accountManager, agent, status
    } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ message: 'Full name and email are required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO owners
        (user_id, full_name, email, phone, address_line, city, emirate, company, account_manager, agent, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, fullName, email, phone || null, addressLine || null, city || null,
        emirate || null, company || null, accountManager || null, agent || null,
        status || 'active'
      ]
    );

    // Friendly unique id shown in the list (e.g. #111)
    const uniqueId = `#${110 + result.insertId}`;
    await pool.execute('UPDATE owners SET unique_id = ? WHERE id = ?', [uniqueId, result.insertId]);

    const [newOwner] = await pool.execute('SELECT * FROM owners WHERE id = ?', [result.insertId]);
    res.status(201).json(newOwner[0]);
  } catch (error) {
    console.error('Create owner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an owner
router.put('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const {
      fullName, email, phone, addressLine, city, emirate,
      company, accountManager, agent, status
    } = req.body;

    await pool.execute(
      `UPDATE owners SET
        full_name = ?, email = ?, phone = ?, address_line = ?, city = ?, emirate = ?,
        company = ?, account_manager = ?, agent = ?, status = ?
       WHERE id = ? AND user_id = ?`,
      [
        fullName, email, phone || null, addressLine || null, city || null, emirate || null,
        company || null, accountManager || null, agent || null, status || 'active',
        req.params.id, userId
      ]
    );

    const [updated] = await pool.execute('SELECT * FROM owners WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update owner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an owner
router.delete('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    await pool.execute('DELETE FROM owners WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    res.json({ message: 'Owner deleted successfully' });
  } catch (error) {
    console.error('Delete owner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get the properties linked to an owner
router.get('/:id/properties', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const [rows] = await pool.execute(
      `SELECT op.id, op.property_id, op.ownership_share, op.management_fee,
              p.title AS property_title, p.area_sqft, p.type
       FROM owner_properties op
       JOIN properties p ON p.id = op.property_id
       JOIN owners o ON o.id = op.owner_id
       WHERE op.owner_id = ? AND o.user_id = ?
       ORDER BY op.created_at ASC`,
      [req.params.id, userId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Get owner properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Link an existing property to an owner
router.post('/:id/properties', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { propertyId, ownershipShare, managementFee } = req.body;
    if (!propertyId) {
      return res.status(400).json({ message: 'Property is required' });
    }

    // Ensure the owner belongs to this user before linking
    const [owners] = await pool.execute(
      'SELECT id FROM owners WHERE id = ? AND user_id = ?',
      [req.params.id, userId]
    );
    if (owners.length === 0) {
      return res.status(404).json({ message: 'Owner not found' });
    }

    await pool.execute(
      `INSERT INTO owner_properties (owner_id, property_id, ownership_share, management_fee)
       VALUES (?, ?, ?, ?)`,
      [req.params.id, propertyId, ownershipShare || 100, managementFee || 5]
    );

    res.status(201).json({ message: 'Property linked successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Property is already linked to this owner' });
    }
    console.error('Link property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unlink a property from an owner
router.delete('/:id/properties/:linkId', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    await pool.execute(
      `DELETE op FROM owner_properties op
       JOIN owners o ON o.id = op.owner_id
       WHERE op.id = ? AND op.owner_id = ? AND o.user_id = ?`,
      [req.params.linkId, req.params.id, userId]
    );

    res.json({ message: 'Property unlinked successfully' });
  } catch (error) {
    console.error('Unlink property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
