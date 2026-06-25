const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all properties for a user
router.get('/', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [properties] = await pool.execute(
      'SELECT * FROM properties WHERE user_id = ? ORDER BY created_at DESC',
      [decoded.userId]
    );

    res.json(properties);
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single property
router.get('/:id', async (req, res) => {
  try {
    const [properties] = await pool.execute(
      'SELECT * FROM properties WHERE id = ?',
      [req.params.id]
    );

    if (properties.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json(properties[0]);
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create property
router.post('/', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { title, address, city, type, bedrooms, bathrooms, areaSqft, rentAmount, status } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO properties (user_id, title, address, city, type, bedrooms, bathrooms, area_sqft, rent_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [decoded.userId, title, address, city, type, bedrooms, bathrooms, areaSqft, rentAmount, status || 'vacant']
    );

    const [newProperty] = await pool.execute(
      'SELECT * FROM properties WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newProperty[0]);
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update property
router.put('/:id', async (req, res) => {
  try {
    const { title, address, city, type, bedrooms, bathrooms, areaSqft, rentAmount, status } = req.body;

    await pool.execute(
      'UPDATE properties SET title = ?, address = ?, city = ?, type = ?, bedrooms = ?, bathrooms = ?, area_sqft = ?, rent_amount = ?, status = ? WHERE id = ?',
      [title, address, city, type, bedrooms, bathrooms, areaSqft, rentAmount, status, req.params.id]
    );

    const [updatedProperty] = await pool.execute(
      'SELECT * FROM properties WHERE id = ?',
      [req.params.id]
    );

    res.json(updatedProperty[0]);
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete property
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM properties WHERE id = ?', [req.params.id]);
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
