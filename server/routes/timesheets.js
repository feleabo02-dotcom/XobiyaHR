import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, requirePermission('attendance', 'read'), async (req, res) => {
  try {
    let query = db('timesheets')
      .join('workers', 'timesheets.worker_id', 'workers.id')
      .select(
        'timesheets.*',
        db.raw('CONCAT(workers.first_name, " ", workers.last_name) as worker_name')
      )
      .where('timesheets.company_id', req.companyId);

    if (req.user.role === 'employee') {
      const worker = await db('workers').where({ user_id: req.user.id, company_id: req.companyId }).first();
      if (worker) query = query.where('timesheets.worker_id', worker.id);
      else return res.json([]);
    }

    if (req.query.startDate) query = query.where('timesheets.date', '>=', req.query.startDate);
    if (req.query.endDate) query = query.where('timesheets.date', '<=', req.query.endDate);
    if (req.query.workerId) query = query.where('timesheets.worker_id', req.query.workerId);

    const rows = await query.orderBy('timesheets.date', 'desc');
    res.json(rows.map(r => ({
      id: String(r.id),
      workerId: String(r.worker_id),
      workerName: r.worker_name,
      assignmentId: r.assignment_id ? String(r.assignment_id) : null,
      projectId: r.project_id,
      date: r.date,
      hours: r.hours,
      billable: Boolean(r.billable),
      description: r.description,
      status: r.status,
      approvedBy: r.approved_by ? String(r.approved_by) : null,
      createdAt: r.created_at,
    })));
  } catch (err) {
    console.error('GET /timesheets error:', err);
    res.status(500).json({ error: 'Failed to fetch timesheets' });
  }
});

router.post('/', verifyToken, requirePermission('attendance', 'create'), async (req, res) => {
  try {
    const { projectId, date, hours, billable, description } = req.body;
    if (!date || hours == null) return res.status(400).json({ error: 'date and hours are required' });

    const worker = await db('workers').where({ user_id: req.user.id, company_id: req.companyId }).first();
    if (!worker) return res.status(400).json({ error: 'No worker profile linked' });

    const [id] = await db('timesheets').insert({
      company_id: req.companyId,
      worker_id: worker.id,
      project_id: projectId || null,
      date,
      hours,
      billable: billable || false,
      description: description || null,
      status: 'draft',
    });

    res.status(201).json({ id: String(id), message: 'Timesheet entry created' });
  } catch (err) {
    console.error('POST /timesheets error:', err);
    res.status(500).json({ error: 'Failed to create timesheet' });
  }
});

router.put('/:id', verifyToken, requirePermission('attendance', 'update'), async (req, res) => {
  try {
    const { projectId, date, hours, billable, description } = req.body;

    const entry = await db('timesheets')
      .join('workers', 'timesheets.worker_id', 'workers.id')
      .select('timesheets.*')
      .where('timesheets.id', req.params.id)
      .andWhere('timesheets.company_id', req.companyId)
      .andWhere('workers.user_id', req.user.id)
      .first();

    if (!entry) return res.status(404).json({ error: 'Timesheet not found or not yours' });

    await db('timesheets').where({ id: req.params.id }).update({
      project_id: projectId ?? entry.project_id,
      date: date ?? entry.date,
      hours: hours ?? entry.hours,
      billable: billable ?? entry.billable,
      description: description ?? entry.description,
      updated_at: db.fn.now(),
    });

    res.json({ message: 'Timesheet updated' });
  } catch (err) {
    console.error('PUT /timesheets/:id error:', err);
    res.status(500).json({ error: 'Failed to update timesheet' });
  }
});

router.delete('/:id', verifyToken, requirePermission('attendance', 'delete'), async (req, res) => {
  try {
    const deleted = await db('timesheets')
      .join('workers', 'timesheets.worker_id', 'workers.id')
      .where('timesheets.id', req.params.id)
      .andWhere('timesheets.company_id', req.companyId)
      .andWhere('workers.user_id', req.user.id)
      .del();

    if (!deleted) return res.status(404).json({ error: 'Timesheet not found or not yours' });
    res.json({ message: 'Timesheet deleted' });
  } catch (err) {
    console.error('DELETE /timesheets/:id error:', err);
    res.status(500).json({ error: 'Failed to delete timesheet' });
  }
});

router.put('/:id/submit', verifyToken, requirePermission('attendance', 'update'), async (req, res) => {
  try {
    const entry = await db('timesheets')
      .join('workers', 'timesheets.worker_id', 'workers.id')
      .select('timesheets.*')
      .where('timesheets.id', req.params.id)
      .andWhere('timesheets.company_id', req.companyId)
      .andWhere('workers.user_id', req.user.id)
      .first();

    if (!entry) return res.status(404).json({ error: 'Timesheet not found' });
    if (entry.status !== 'draft') return res.status(400).json({ error: 'Only draft entries can be submitted' });

    await db('timesheets').where({ id: req.params.id }).update({ status: 'submitted', updated_at: db.fn.now() });
    res.json({ message: 'Timesheet submitted' });
  } catch (err) {
    console.error('PUT /timesheets/:id/submit error:', err);
    res.status(500).json({ error: 'Failed to submit timesheet' });
  }
});

router.put('/:id/approve', verifyToken, requirePermission('attendance', 'approve'), async (req, res) => {
  try {
    await db('timesheets').where({ id: req.params.id }).update({
      status: 'approved',
      approved_by: req.user.id,
      updated_at: db.fn.now(),
    });
    res.json({ message: 'Timesheet approved' });
  } catch (err) {
    console.error('PUT /timesheets/:id/approve error:', err);
    res.status(500).json({ error: 'Failed to approve timesheet' });
  }
});

export default router;
