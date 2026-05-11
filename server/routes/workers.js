import { Router } from 'express';
import pool from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, first_name, last_name, email, phone, worker_type, hire_date, status, department, job_title, photo_url, created_at, updated_at FROM workers ORDER BY last_name ASC'
    );
    res.json(rows.map(mapWorker));
  } catch (err) {
    console.error('GET /workers error:', err);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM workers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Worker not found' });
    res.json(mapWorker(rows[0]));
  } catch (err) {
    console.error('GET /workers/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch worker' });
  }
});

router.post('/', verifyToken, requireRole('hr', 'manager'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, workerType, hireDate, status, department, jobTitle } = req.body;
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'firstName, lastName, and email are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO workers (first_name, last_name, email, phone, worker_type, hire_date, status, department, job_title)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, email, phone || null, workerType || 'employee', hireDate || null, status || 'onboarding', department || null, jobTitle || null]
    );

    const [rows] = await pool.query('SELECT * FROM workers WHERE id = ?', [result.insertId]);
    res.status(201).json(mapWorker(rows[0]));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A worker with this email already exists' });
    }
    console.error('POST /workers error:', err);
    res.status(500).json({ error: 'Failed to create worker' });
  }
});

router.put('/:id', verifyToken, requireRole('hr', 'manager'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, workerType, hireDate, status, department, jobTitle } = req.body;

    const [existing] = await pool.query('SELECT id FROM workers WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Worker not found' });

    await pool.query(
      `UPDATE workers SET first_name = ?, last_name = ?, email = ?, phone = ?, worker_type = ?, hire_date = ?, status = ?, department = ?, job_title = ? WHERE id = ?`,
      [firstName, lastName, email, phone, workerType, hireDate, status, department, jobTitle, req.params.id]
    );

    const [rows] = await pool.query('SELECT * FROM workers WHERE id = ?', [req.params.id]);
    res.json(mapWorker(rows[0]));
  } catch (err) {
    console.error('PUT /workers/:id error:', err);
    res.status(500).json({ error: 'Failed to update worker' });
  }
});

router.delete('/:id', verifyToken, requireRole('hr'), async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM workers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Worker not found' });
    res.json({ message: 'Worker deleted' });
  } catch (err) {
    console.error('DELETE /workers/:id error:', err);
    res.status(500).json({ error: 'Failed to delete worker' });
  }
});

function mapWorker(row) {
  return {
    id: String(row.id),
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    workerType: row.worker_type,
    hireDate: row.hire_date,
    terminationDate: row.termination_date,
    status: row.status,
    department: row.department,
    jobTitle: row.job_title,
    photoUrl: row.photo_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default router;
