const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { sendTaskNotification } = require('../services/email');

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

// Shared SELECT: task row + related property name.
const TASK_SELECT = `
  SELECT t.*, p.title AS related_property_name
  FROM tasks t
  LEFT JOIN properties p ON p.id = t.related_property_id
`;

function splitEmails(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// List tasks for the authenticated user (optional ?priority filter)
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { priority } = req.query;
    let sql = `${TASK_SELECT} WHERE t.user_id = ?`;
    const params = [userId];
    if (priority) {
      sql += ' AND t.priority = ?';
      params.push(priority);
    }
    sql += ' ORDER BY t.created_at DESC';

    const [tasks] = await pool.execute(sql, params);
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single task
router.get('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const [tasks] = await pool.execute(
      `${TASK_SELECT} WHERE t.id = ? AND t.user_id = ?`,
      [req.params.id, userId]
    );
    if (tasks.length === 0) return res.status(404).json({ message: 'Task not found' });
    res.json(tasks[0]);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a task — best-effort notification to the supplied emails.
router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const {
      title, assignTo, dueDate, priority, relatedPropertyId, notificationEmails, status,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO tasks
        (user_id, title, assign_to, due_date, priority, related_property_id, notification_emails, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        title.trim(),
        assignTo || null,
        dueDate || null,
        priority || 'low',
        relatedPropertyId || null,
        notificationEmails || null,
        status || 'open',
      ]
    );

    const [created] = await pool.execute(`${TASK_SELECT} WHERE t.id = ?`, [result.insertId]);

    // Notify (non-blocking on failure).
    try {
      await sendTaskNotification({ to: splitEmails(notificationEmails), task: created[0] });
    } catch (notifyErr) {
      console.error('Task notification error:', notifyErr.message);
    }

    res.status(201).json(created[0]);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a task
router.put('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const {
      title, assignTo, dueDate, priority, relatedPropertyId, notificationEmails, status,
    } = req.body;

    await pool.execute(
      `UPDATE tasks SET
        title = ?, assign_to = ?, due_date = ?, priority = ?,
        related_property_id = ?, notification_emails = ?, status = ?
       WHERE id = ? AND user_id = ?`,
      [
        title ? title.trim() : null,
        assignTo || null,
        dueDate || null,
        priority || 'low',
        relatedPropertyId || null,
        notificationEmails || null,
        status || 'open',
        req.params.id,
        userId,
      ]
    );

    const [updated] = await pool.execute(
      `${TASK_SELECT} WHERE t.id = ? AND t.user_id = ?`,
      [req.params.id, userId]
    );
    if (updated.length === 0) return res.status(404).json({ message: 'Task not found' });
    res.json(updated[0]);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    await pool.execute('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
