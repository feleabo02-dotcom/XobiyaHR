import { Router } from 'express';
import pool from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, p.title as position_title, p.department,
              u1.display_name as requested_by_name,
              u2.display_name as approved_by_name
       FROM requisitions r
       JOIN positions p ON r.position_id = p.id
       LEFT JOIN users u1 ON r.requested_by = u1.id
       LEFT JOIN users u2 ON r.approved_by = u2.id
       ORDER BY r.created_at DESC`
    );
    res.json(rows.map(mapRequisition));
  } catch (err) {
    console.error('GET /requisitions error:', err);
    res.status(500).json({ error: 'Failed to fetch requisitions' });
  }
});

router.post('/', verifyToken, requireRole('hr', 'manager'), async (req, res) => {
  try {
    const { positionId, budgetedSalary, notes } = req.body;
    if (!positionId) {
      return res.status(400).json({ error: 'positionId is required' });
    }

    const [result] = await pool.query(
      `INSERT INTO requisitions (position_id, budgeted_salary, status, requested_by, open_date, notes)
       VALUES (?, ?, 'open', ?, CURDATE(), ?)`,
      [positionId, budgetedSalary || null, req.user.id, notes || null]
    );

    const [rows] = await pool.query(
      `SELECT r.*, p.title as position_title, p.department,
              u.display_name as requested_by_name
       FROM requisitions r
       JOIN positions p ON r.position_id = p.id
       LEFT JOIN users u ON r.requested_by = u.id
       WHERE r.id = ?`,
      [result.insertId]
    );
    res.status(201).json(mapRequisition(rows[0]));
  } catch (err) {
    console.error('POST /requisitions error:', err);
    res.status(500).json({ error: 'Failed to create requisition' });
  }
});

router.put('/:id/status', verifyToken, requireRole('hr'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['closed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "closed" or "cancelled"' });
    }

    const [existing] = await pool.query('SELECT id FROM requisitions WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Requisition not found' });

    await pool.query(
      'UPDATE requisitions SET status = ?, approved_by = ?, close_date = CURDATE() WHERE id = ?',
      [status, req.user.id, req.params.id]
    );

    const [rows] = await pool.query(
      `SELECT r.*, p.title as position_title, p.department,
              u1.display_name as requested_by_name,
              u2.display_name as approved_by_name
       FROM requisitions r
       JOIN positions p ON r.position_id = p.id
       LEFT JOIN users u1 ON r.requested_by = u1.id
       LEFT JOIN users u2 ON r.approved_by = u2.id
       WHERE r.id = ?`,
      [req.params.id]
    );
    res.json(mapRequisition(rows[0]));
  } catch (err) {
    console.error('PUT /requisitions/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update requisition' });
  }
});

function mapRequisition(row) {
  return {
    id: String(row.id),
    positionId: String(row.position_id),
    positionTitle: row.position_title,
    department: row.department,
    budgetedSalary: row.budgeted_salary,
    currency: row.currency,
    status: row.status,
    requestedBy: row.requested_by ? String(row.requested_by) : undefined,
    requestedByName: row.requested_by_name,
    approvedBy: row.approved_by ? String(row.approved_by) : undefined,
    approvedByName: row.approved_by_name,
    openDate: row.open_date,
    closeDate: row.close_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default router;
