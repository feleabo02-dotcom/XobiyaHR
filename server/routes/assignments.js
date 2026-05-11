import { Router } from 'express';
import pool from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*,
              w.first_name, w.last_name, w.email as worker_email,
              p.title as position_title, p.department
       FROM assignments a
       JOIN workers w ON a.worker_id = w.id
       JOIN positions p ON a.position_id = p.id
       ORDER BY a.created_at DESC`
    );
    res.json(rows.map(mapAssignment));
  } catch (err) {
    console.error('GET /assignments error:', err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

router.post('/', verifyToken, requireRole('hr'), async (req, res) => {
  try {
    const { workerId, positionId, startDate, endDate, managerId } = req.body;
    if (!workerId || !positionId || !startDate) {
      return res.status(400).json({ error: 'workerId, positionId, and startDate are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO assignments (worker_id, position_id, start_date, end_date, manager_id)
       VALUES (?, ?, ?, ?, ?)`,
      [workerId, positionId, startDate, endDate || null, managerId || null]
    );

    await pool.query('UPDATE positions SET status = ? WHERE id = ?', ['filled', positionId]);

    const [rows] = await pool.query(
      `SELECT a.*, w.first_name, w.last_name, w.email as worker_email, p.title as position_title, p.department
       FROM assignments a
       JOIN workers w ON a.worker_id = w.id
       JOIN positions p ON a.position_id = p.id
       WHERE a.id = ?`,
      [result.insertId]
    );
    res.status(201).json(mapAssignment(rows[0]));
  } catch (err) {
    console.error('POST /assignments error:', err);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

router.put('/:id', verifyToken, requireRole('hr'), async (req, res) => {
  try {
    const { endDate, managerId } = req.body;

    const [existing] = await pool.query('SELECT * FROM assignments WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Assignment not found' });

    await pool.query(
      'UPDATE assignments SET end_date = ?, manager_id = ? WHERE id = ?',
      [endDate || existing[0].end_date, managerId || existing[0].manager_id, req.params.id]
    );

    if (endDate) {
      const positionId = existing[0].position_id;
      const [activeAssignments] = await pool.query(
        'SELECT id FROM assignments WHERE position_id = ? AND end_date IS NULL AND id != ?',
        [positionId, req.params.id]
      );
      if (activeAssignments.length === 0) {
        await pool.query('UPDATE positions SET status = ? WHERE id = ?', ['vacant', positionId]);
      }
    }

    const [rows] = await pool.query(
      `SELECT a.*, w.first_name, w.last_name, w.email as worker_email, p.title as position_title, p.department
       FROM assignments a
       JOIN workers w ON a.worker_id = w.id
       JOIN positions p ON a.position_id = p.id
       WHERE a.id = ?`,
      [req.params.id]
    );
    res.json(mapAssignment(rows[0]));
  } catch (err) {
    console.error('PUT /assignments/:id error:', err);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

function mapAssignment(row) {
  return {
    id: String(row.id),
    workerId: String(row.worker_id),
    workerName: `${row.first_name} ${row.last_name}`,
    workerEmail: row.worker_email,
    positionId: String(row.position_id),
    positionTitle: row.position_title,
    department: row.department,
    startDate: row.start_date,
    endDate: row.end_date,
    managerId: row.manager_id ? String(row.manager_id) : undefined,
    isPrimary: Boolean(row.is_primary),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default router;
