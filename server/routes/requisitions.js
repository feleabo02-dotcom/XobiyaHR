import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const rows = await db('requisitions')
      .join('positions', 'requisitions.position_id', 'positions.id')
      .leftJoin('departments', 'positions.department_id', 'departments.id')
      .leftJoin('users as req_users', 'requisitions.requested_by', 'req_users.id')
      .leftJoin('users as app_users', 'requisitions.approved_by', 'app_users.id')
      .select(
        'requisitions.*',
        'positions.title as position_title',
        'departments.name as department_name',
        'req_users.display_name as requested_by_name',
        'app_users.display_name as approved_by_name'
      )
      .orderBy('requisitions.created_at', 'desc');

    res.json(rows.map(r => ({
      id: String(r.id),
      positionId: String(r.position_id),
      positionTitle: r.position_title,
      departmentName: r.department_name,
      budgetedSalary: r.budgeted_salary,
      currency: r.currency,
      status: r.status,
      requestedBy: r.requested_by ? String(r.requested_by) : null,
      requestedByName: r.requested_by_name,
      approvedBy: r.approved_by ? String(r.approved_by) : null,
      approvedByName: r.approved_by_name,
      openDate: r.open_date,
      closeDate: r.close_date,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })));
  } catch (err) {
    console.error('GET /requisitions error:', err);
    res.status(500).json({ error: 'Failed to fetch requisitions' });
  }
});

router.post('/', verifyToken, requireRole('hr', 'manager'), async (req, res) => {
  try {
    const { positionId, budgetedSalary, notes } = req.body;
    if (!positionId) return res.status(400).json({ error: 'positionId is required' });

    const [id] = await db('requisitions').insert({
      position_id: positionId,
      budgeted_salary: budgetedSalary || null,
      status: 'open',
      requested_by: req.user.id,
      open_date: db.fn.now(),
      notes: notes || null,
    });

    res.status(201).json({ id: String(id), message: 'Requisition created' });
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

    const existing = await db('requisitions').where({ id: req.params.id }).first();
    if (!existing) return res.status(404).json({ error: 'Requisition not found' });

    await db('requisitions').where({ id: req.params.id }).update({
      status,
      approved_by: req.user.id,
      close_date: db.fn.now(),
      updated_at: db.fn.now(),
    });

    res.json({ message: `Requisition ${status}` });
  } catch (err) {
    console.error('PUT /requisitions/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update requisition' });
  }
});

export default router;
