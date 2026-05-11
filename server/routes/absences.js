import { Router } from 'express';
import pool from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    let query = `SELECT a.*, w.first_name, w.last_name FROM absences a LEFT JOIN workers w ON a.worker_id = w.id`;

    if (req.user.role === 'employee') {
      const [worker] = await pool.query('SELECT id FROM workers WHERE user_id = ?', [req.user.id]);
      if (worker.length > 0) {
        query += ` WHERE a.worker_id = ${worker[0].id}`;
      } else {
        return res.json([]);
      }
    }

    query += ' ORDER BY a.created_at DESC';
    const [rows] = await pool.query(query);
    res.json(rows.map(r => mapAbsence(r)));
  } catch (err) {
    console.error('GET /absences error:', err);
    res.status(500).json({ error: 'Failed to fetch absences' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    if (!type || !startDate || !endDate) {
      return res.status(400).json({ error: 'type, startDate, and endDate are required' });
    }

    const [worker] = await pool.query('SELECT id FROM workers WHERE user_id = ?', [req.user.id]);
    if (worker.length === 0) {
      return res.status(400).json({ error: 'No worker profile linked to your account' });
    }

    const [result] = await pool.query(
      `INSERT INTO absences (worker_id, type, start_date, end_date, reason, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [worker[0].id, type, startDate, endDate, reason || null]
    );

    const [rows] = await pool.query('SELECT * FROM absences WHERE id = ?', [result.insertId]);
    res.status(201).json(mapAbsence(rows[0]));
  } catch (err) {
    console.error('POST /absences error:', err);
    res.status(500).json({ error: 'Failed to create absence request' });
  }
});

router.put('/:id/status', verifyToken, requireRole('hr', 'manager'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
    }

    const [existing] = await pool.query('SELECT id FROM absences WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Absence not found' });

    await pool.query(
      'UPDATE absences SET status = ?, approved_by = ? WHERE id = ?',
      [status, req.user.id, req.params.id]
    );

    const [rows] = await pool.query('SELECT * FROM absences WHERE id = ?', [req.params.id]);
    res.json(mapAbsence(rows[0]));
  } catch (err) {
    console.error('PUT /absences/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update absence status' });
  }
});

router.put('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.* FROM absences a
       JOIN workers w ON a.worker_id = w.id
       WHERE a.id = ? AND w.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Absence not found or not yours' });

    await pool.query('UPDATE absences SET status = ? WHERE id = ?', ['cancelled', req.params.id]);
    const [updated] = await pool.query('SELECT * FROM absences WHERE id = ?', [req.params.id]);
    res.json(mapAbsence(updated[0]));
  } catch (err) {
    console.error('PUT /absences/:id/cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel absence' });
  }
});

function mapAbsence(row) {
  return {
    id: String(row.id),
    workerId: String(row.worker_id),
    workerName: row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : undefined,
    type: row.type,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    reason: row.reason,
    approvedBy: row.approved_by ? String(row.approved_by) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default router;
