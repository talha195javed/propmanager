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

function leaseEnd(startDate, leaseLength) {
  const d = new Date(startDate);
  if (Number.isNaN(d.getTime())) return null;
  const months = parseInt(String(leaseLength || '12').match(/\d+/)?.[0] || '12', 10);
  d.setMonth(d.getMonth() + months);
  d.setDate(d.getDate() - 1);
  return d;
}

// Aggregated dashboard payload for the authenticated user.
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // --- Rental listings (unit breakdown) ---
    const [[rl]] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         COALESCE(SUM(u.status = 'occupied'), 0) AS occupied,
         COALESCE(SUM(u.status = 'vacant'), 0) AS vacant,
         COALESCE(SUM(u.status IN ('expiring', 'expired')), 0) AS booked
       FROM units u
       JOIN properties p ON p.id = u.property_id
       WHERE p.user_id = ?`,
      [userId]
    );

    // --- Overview ---
    const [[om]] = await pool.execute(
      `SELECT COUNT(*) AS c FROM maintenance_requests WHERE user_id = ? AND status = 'in_progress'`,
      [userId]
    );
    const [[op]] = await pool.execute(
      `SELECT COUNT(*) AS c
       FROM payments pay
       JOIN properties p ON p.id = pay.property_id
       WHERE p.user_id = ? AND pay.status = 'overdue'`,
      [userId]
    );

    // --- Outstanding balances (unpaid payments grouped by property) ---
    const [outstanding] = await pool.execute(
      `SELECT p.id, p.title AS name, SUM(pay.amount) AS amount
       FROM payments pay
       JOIN properties p ON p.id = pay.property_id
       WHERE p.user_id = ? AND pay.status IN ('pending', 'overdue')
       GROUP BY p.id, p.title
       ORDER BY amount DESC
       LIMIT 8`,
      [userId]
    );
    const outstandingTotal = outstanding.reduce((s, r) => s + Number(r.amount || 0), 0);

    // --- Open tasks ---
    const [tasks] = await pool.execute(
      `SELECT id, title, assign_to, priority, status, created_at
       FROM tasks WHERE user_id = ? AND status = 'open'
       ORDER BY created_at DESC LIMIT 6`,
      [userId]
    );
    const [[tc]] = await pool.execute(
      `SELECT COUNT(*) AS c FROM tasks WHERE user_id = ? AND status = 'open'`,
      [userId]
    );

    // --- Expiring leases (bucketed by days-until-end) ---
    const [activeLeases] = await pool.execute(
      `SELECT l.id, l.start_date, l.lease_length
       FROM leases l WHERE l.user_id = ? AND l.status = 'active'`,
      [userId]
    );
    const today = new Date();
    const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, all: 0 };
    for (const l of activeLeases) {
      const end = leaseEnd(l.start_date, l.lease_length);
      if (!end) continue;
      const days = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
      if (days < 0) continue;
      buckets.all += 1;
      if (days <= 30) buckets['0-30'] += 1;
      else if (days <= 60) buckets['31-60'] += 1;
      else if (days <= 90) buckets['61-90'] += 1;
    }

    // --- Recent activity (recent records across entities) ---
    const [recentMaint] = await pool.execute(
      `SELECT id, title, reference_number, created_at
       FROM maintenance_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );
    const [recentLeases] = await pool.execute(
      `SELECT l.id, p.title AS property_name, u.name AS unit_name, l.created_at
       FROM leases l
       LEFT JOIN properties p ON p.id = l.property_id
       LEFT JOIN units u ON u.id = l.unit_id
       WHERE l.user_id = ? ORDER BY l.created_at DESC LIMIT 5`,
      [userId]
    );
    const [recentTenants] = await pool.execute(
      `SELECT id, full_name, created_at
       FROM tenants WHERE owner_user_id = ? ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );

    const activity = [
      ...recentMaint.map((m) => ({
        type: 'Service',
        title: m.title,
        subtitle: `Service request ${m.reference_number || ''}`.trim(),
        date: m.created_at,
        link: `/admin/maintenance/${m.id}`,
      })),
      ...recentLeases.map((l) => ({
        type: 'Lease',
        title: `${l.property_name || 'Lease'}${l.unit_name ? ` — ${l.unit_name}` : ''}`,
        subtitle: 'New lease created',
        date: l.created_at,
        link: `/admin/lease/${l.id}`,
      })),
      ...recentTenants.map((t) => ({
        type: 'Tenant',
        title: t.full_name || 'Tenant',
        subtitle: 'New tenant added',
        date: t.created_at,
        link: `/admin/tenants/${t.id}`,
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);

    res.json({
      rentalListings: {
        totalUnits: Number(rl.total) || 0,
        occupied: Number(rl.occupied) || 0,
        vacant: Number(rl.vacant) || 0,
        booked: Number(rl.booked) || 0,
      },
      overview: {
        overduePayments: Number(op.c) || 0,
        openMaintenance: Number(om.c) || 0,
      },
      outstanding: {
        total: outstandingTotal,
        items: outstanding.map((r) => ({ id: r.id, name: r.name, amount: Number(r.amount || 0) })),
      },
      tasks: { count: Number(tc.c) || 0, items: tasks },
      expiringLeases: buckets,
      recentActivity: activity,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
