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

// Counts (units + occupied) used to compute occupancy for cards/detail.
const COUNT_FIELDS = `
  (SELECT COUNT(*) FROM units u WHERE u.property_id = p.id) AS units_count,
  (SELECT COUNT(*) FROM units u WHERE u.property_id = p.id AND u.status = 'occupied') AS occupied_count
`;

// Get all properties for the authenticated user
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const [properties] = await pool.execute(
      `SELECT p.*, ${COUNT_FIELDS}
       FROM properties p
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json(properties);
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single property (with unit counts + linked owner summary)
router.get('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const [properties] = await pool.execute(
      `SELECT p.*, ${COUNT_FIELDS}
       FROM properties p
       WHERE p.id = ? AND p.user_id = ?`,
      [req.params.id, userId]
    );

    if (properties.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const property = properties[0];

    // Pull the first linked owner (if any) for the "Owner details" tab.
    const [owners] = await pool.execute(
      `SELECT o.full_name AS owner_name, o.company, o.account_manager, o.agent,
              o.status AS owner_status, op.management_fee
       FROM owner_properties op
       JOIN owners o ON o.id = op.owner_id
       WHERE op.property_id = ?
       ORDER BY op.created_at ASC
       LIMIT 1`,
      [req.params.id]
    );
    property.owner = owners[0] || null;

    res.json(property);
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create property
router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const {
      title, address, city, emirate, propertyType, phone, email,
      units, imageUrl, operatingAccount, rentalInvoice, manager, status,
    } = req.body;

    if (!title || !address) {
      return res.status(400).json({ message: 'Property name and address are required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO properties
        (user_id, title, address, city, emirate, type, property_type, phone, email,
         units, image_url, operating_account, rental_invoice, manager, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, title, address, city || null, emirate || null,
        // keep legacy ENUM `type` valid; default to 'apartment'
        'apartment',
        propertyType || 'Residential', phone || null, email || null,
        Number(units) || 0, imageUrl || null, operatingAccount || null,
        rentalInvoice ? 1 : 0, manager || null, status || 'vacant',
      ]
    );

    const [newProperty] = await pool.execute('SELECT * FROM properties WHERE id = ?', [result.insertId]);
    res.status(201).json(newProperty[0]);
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update property
router.put('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const {
      title, address, city, emirate, propertyType, phone, email,
      units, imageUrl, operatingAccount, rentalInvoice, manager, status,
    } = req.body;

    await pool.execute(
      `UPDATE properties SET
        title = ?, address = ?, city = ?, emirate = ?, property_type = ?,
        phone = ?, email = ?, units = ?, image_url = ?, operating_account = ?,
        rental_invoice = ?, manager = ?, status = ?
       WHERE id = ? AND user_id = ?`,
      [
        title, address, city || null, emirate || null, propertyType || 'Residential',
        phone || null, email || null, Number(units) || 0, imageUrl || null,
        operatingAccount || null, rentalInvoice ? 1 : 0, manager || null,
        status || 'vacant', req.params.id, userId,
      ]
    );

    const [updated] = await pool.execute('SELECT * FROM properties WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete property
router.delete('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    await pool.execute('DELETE FROM properties WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- Units (nested under a property) ----

// Confirm the property belongs to the authenticated user.
async function ownsProperty(userId, propertyId) {
  const [rows] = await pool.execute(
    'SELECT id FROM properties WHERE id = ? AND user_id = ?',
    [propertyId, userId]
  );
  return rows.length > 0;
}

// List units for a property
router.get('/:id/units', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!(await ownsProperty(userId, req.params.id))) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const [units] = await pool.execute(
      'SELECT * FROM units WHERE property_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(units);
  } catch (error) {
    console.error('Get units error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single unit
router.get('/:id/units/:unitId', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!(await ownsProperty(userId, req.params.id))) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const [units] = await pool.execute(
      'SELECT * FROM units WHERE id = ? AND property_id = ?',
      [req.params.unitId, req.params.id]
    );
    if (units.length === 0) return res.status(404).json({ message: 'Unit not found' });
    res.json(units[0]);
  } catch (error) {
    console.error('Get unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a unit
router.post('/:id/units', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!(await ownsProperty(userId, req.params.id))) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const {
      name, unitType, bedrooms, bathrooms, sizeSqft, marketRent,
      status, tenantName, tenantEmail, tenantPhone,
    } = req.body;

    if (!name) return res.status(400).json({ message: 'Unit name is required' });

    const [result] = await pool.execute(
      `INSERT INTO units
        (property_id, name, unit_type, bedrooms, bathrooms, size_sqft, market_rent,
         status, tenant_name, tenant_email, tenant_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.id, name, unitType || null,
        bedrooms ? Number(bedrooms) : null, bathrooms ? Number(bathrooms) : null,
        sizeSqft ? Number(sizeSqft) : null, marketRent ? Number(marketRent) : null,
        status || 'vacant', tenantName || null, tenantEmail || null, tenantPhone || null,
      ]
    );

    const [newUnit] = await pool.execute('SELECT * FROM units WHERE id = ?', [result.insertId]);
    res.status(201).json(newUnit[0]);
  } catch (error) {
    console.error('Create unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a unit
router.put('/:id/units/:unitId', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!(await ownsProperty(userId, req.params.id))) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const {
      name, unitType, bedrooms, bathrooms, sizeSqft, marketRent,
      status, tenantName, tenantEmail, tenantPhone,
    } = req.body;

    await pool.execute(
      `UPDATE units SET
        name = ?, unit_type = ?, bedrooms = ?, bathrooms = ?, size_sqft = ?,
        market_rent = ?, status = ?, tenant_name = ?, tenant_email = ?, tenant_phone = ?
       WHERE id = ? AND property_id = ?`,
      [
        name, unitType || null,
        bedrooms ? Number(bedrooms) : null, bathrooms ? Number(bathrooms) : null,
        sizeSqft ? Number(sizeSqft) : null, marketRent ? Number(marketRent) : null,
        status || 'vacant', tenantName || null, tenantEmail || null, tenantPhone || null,
        req.params.unitId, req.params.id,
      ]
    );

    const [updated] = await pool.execute('SELECT * FROM units WHERE id = ?', [req.params.unitId]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a unit
router.delete('/:id/units/:unitId', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!(await ownsProperty(userId, req.params.id))) {
      return res.status(404).json({ message: 'Property not found' });
    }

    await pool.execute('DELETE FROM units WHERE id = ? AND property_id = ?', [
      req.params.unitId, req.params.id,
    ]);
    res.json({ message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Delete unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
