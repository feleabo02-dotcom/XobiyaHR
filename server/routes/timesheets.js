import { Router } from 'express';
import pool from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    let query = `SELECT t.*, w.first_name, w.last_name FROM timesheets t JOIN workers w ON t.worker_id = w.id`;

    if (req.user.role === 'employee') {
      const [worker] = await pool.query('SELECT id FROM workers WHERE user_id = ?', [req.user.id]);
      if (worker.length > 0) {
        query += ` WHERE t.worker_id = ${worker[0].id}`;
      } else {
        return res.json([]);
      }
    }

    if (req.query.startDate) {
      const clause = query.includes('WHERE') ? 'AND' : 'WHERE';
      query += ` ${clause} t.date >= '${req.query.startDate}'`;
    }
    if (req.query.endDate) {
      const clause = query.includes('WHERE') ? 'AND' : 'WHERE';
      query += ` ${clause} t.date <= '${req.query.endDate}'`;
    }

    query += ' ORDER BY t.date DESC';
    const [rows] = await pool.query(query);
    res.json(rows.map(mapTimesheet));
  } catch (err) {
    console.error('GET /timesheets error:', err);
    res.status(500).json({ error: 'Failed to fetch timesheets' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { projectId, date, hours, billable, description } = req.body;
    if (!date || hours == null) {
      return res.status(400).json({ error: 'date and hours are required' });
    }

    const [worker] = await pool.query('SELECT id FROM workers WHERE user_id = ?', [req.user.id]);
    if (worker.length === 0) {
      return res.status(400).json({ error: 'No worker profile linked to your account' });
    }

    const [result] = await pool.query(
      `INSERT INTO timesheets (worker_id, project_id, date, hours, billable, description, status)
       VALUES (?, ?, ?, ?, ?, ?, 'draft')`,
      [worker[0].id, projectId || null, date, hours, billable || false, description || null]
    );

    const [rows] = await pool.query('SELECT * FROM timesheets WHERE id = ?', [result.insertId]);
    res.status(201).json(mapTimesheet(rows[0]));
  } catch (err) {
    console.error('POST /timesheets error:', err);
    res.status(500).json({ error: 'Failed to create timesheet entry' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { projectId, date, hours, billable, description } = req.body;

    const [rows] = await pool.query(
      `SELECT t.* FROM timesheets t JOIN workers w ON t.worker_id = w.id
       WHERE t.id = ? AND w.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Timesheet not found or not yours' });

    await pool.query(
      `UPDATE timesheets SET project_id = ?, date = ?, hours = ?, billable = ?, description = ? WHERE id = ?`,
      [projectId || rows[0].project_id, date || rows[0].date, hours ?? rows[0].hours, billable ?? rows[0].billable, description || rows[0].description, req.params.id]
    );

    const [updated] = await pool.query('SELECT * FROM timesheets WHERE id = ?', [req.params.id]);
    res.json(mapTimesheet(updated[0]));
  } catch (err) {
    console.error('PUT /timesheets/:id error:', err);
    res.status(500).json({ error: 'Failed to update timesheet' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const [result] = await pool.query(
      `DELETE t FROM timesheets t JOIN workers w ON t.worker_id = w.id
       WHERE t.id = ? AND w.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Timesheet not found or not yours' });
    res.json({ message: 'Timesheet entry deleted' });
  } catch (err) {
    console.error('DELETE /timesheets/:id error:', err);
    res.status(500).json({ error: 'Failed to delete timesheet' });
  }
});

function mapTimesheet(row) {
  return {
    id: String(row.id),
    workerId: String(row.worker_id),
    workerName: row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : undefined,
    projectId: row.project_id,
    date: row.date,
    hours: row.hours,
    billable: Boolean(row.billable),
    description: row.description,
    status: row.status,
    approvedBy: row.approved_by ? String(row.approved_by) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default router;
