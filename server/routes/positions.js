import { Router } from 'express';
import pool from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, grade_code, cost_center_id, department, location, fte, status, description, created_at, updated_at FROM positions ORDER BY title ASC'
    );
    res.json(rows.map(mapPosition));
  } catch (err) {
    console.error('GET /positions error:', err);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM positions WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Position not found' });
    res.json(mapPosition(rows[0]));
  } catch (err) {
    console.error('GET /positions/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch position' });
  }
});

router.post('/', verifyToken, requireRole('hr'), async (req, res) => {
  try {
    const { title, gradeCode, costCenterId, department, location, fte, status, description } = req.body;
    if (!title || !costCenterId) {
      return res.status(400).json({ error: 'title and costCenterId are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO positions (title, grade_code, cost_center_id, department, location, fte, status, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, gradeCode || null, costCenterId, department || null, location || null, fte || 1.0, status || 'vacant', description || null]
    );

    const [rows] = await pool.query('SELECT * FROM positions WHERE id = ?', [result.insertId]);
    res.status(201).json(mapPosition(rows[0]));
  } catch (err) {
    console.error('POST /positions error:', err);
    res.status(500).json({ error: 'Failed to create position' });
  }
});

router.put('/:id', verifyToken, requireRole('hr'), async (req, res) => {
  try {
    const { title, gradeCode, costCenterId, department, location, fte, status, description } = req.body;

    const [existing] = await pool.query('SELECT id FROM positions WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Position not found' });

    await pool.query(
      `UPDATE positions SET title = ?, grade_code = ?, cost_center_id = ?, department = ?, location = ?, fte = ?, status = ?, description = ? WHERE id = ?`,
      [title, gradeCode, costCenterId, department, location, fte, status, description, req.params.id]
    );

    const [rows] = await pool.query('SELECT * FROM positions WHERE id = ?', [req.params.id]);
    res.json(mapPosition(rows[0]));
  } catch (err) {
    console.error('PUT /positions/:id error:', err);
    res.status(500).json({ error: 'Failed to update position' });
  }
});

router.delete('/:id', verifyToken, requireRole('hr'), async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM positions WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Position not found' });
    res.json({ message: 'Position deleted' });
  } catch (err) {
    console.error('DELETE /positions/:id error:', err);
    res.status(500).json({ error: 'Failed to delete position' });
  }
});

function mapPosition(row) {
  return {
    id: String(row.id),
    title: row.title,
    gradeCode: row.grade_code,
    costCenterId: row.cost_center_id,
    department: row.department,
    location: row.location,
    fte: row.fte,
    status: row.status,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default router;
