import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, requirePermission('hr', 'read'), async (req, res) => {
  try {
    const rows = await db('assignments')
      .join('workers', 'assignments.worker_id', 'workers.id')
      .join('positions', 'assignments.position_id', 'positions.id')
      .leftJoin('departments', 'positions.department_id', 'departments.id')
      .select(
        'assignments.*',
        db.raw('CONCAT(workers.first_name, " ", workers.last_name) as worker_name'),
        'workers.email as worker_email',
        'positions.title as position_title',
        'departments.name as department_name'
      )
      .where('assignments.company_id', req.companyId)
      .orderBy('assignments.created_at', 'desc');

    res.json(rows.map(r => ({
      id: String(r.id),
      workerId: String(r.worker_id),
      workerName: r.worker_name,
      workerEmail: r.worker_email,
      positionId: String(r.position_id),
      positionTitle: r.position_title,
      departmentName: r.department_name,
      startDate: r.start_date,
      endDate: r.end_date,
      managerId: r.manager_id ? String(r.manager_id) : null,
      isPrimary: Boolean(r.is_primary),
      createdAt: r.created_at,
    })));
  } catch (err) {
    console.error('GET /assignments error:', err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

router.post('/', verifyToken, requirePermission('hr', 'create'), async (req, res) => {
  try {
    const { workerId, positionId, startDate, endDate, managerId } = req.body;
    if (!workerId || !positionId || !startDate) {
      return res.status(400).json({ error: 'workerId, positionId, and startDate are required' });
    }

    const [id] = await db('assignments').insert({
      company_id: req.companyId,
      worker_id: workerId,
      position_id: positionId,
      start_date: startDate,
      end_date: endDate || null,
      manager_id: managerId || null,
    });

    await db('positions').where({ id: positionId, company_id: req.companyId }).update({ status: 'filled', updated_at: db.fn.now() });

    res.status(201).json({ id: String(id), message: 'Assignment created' });
  } catch (err) {
    console.error('POST /assignments error:', err);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

router.put('/:id', verifyToken, requirePermission('hr', 'update'), async (req, res) => {
  try {
    const { endDate, managerId } = req.body;
    const existing = await db('assignments').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!existing) return res.status(404).json({ error: 'Assignment not found' });

    await db('assignments').where({ id: req.params.id }).update({
      end_date: endDate || existing.end_date,
      manager_id: managerId || existing.manager_id,
      updated_at: db.fn.now(),
    });

    if (endDate) {
      const active = await db('assignments')
        .where({ position_id: existing.position_id, company_id: req.companyId })
        .whereNull('end_date')
        .whereNot({ id: req.params.id })
        .first();
      if (!active) {
        await db('positions').where({ id: existing.position_id, company_id: req.companyId }).update({ status: 'vacant', updated_at: db.fn.now() });
      }
    }
    res.json({ message: 'Assignment updated' });
  } catch (err) {
    console.error('PUT /assignments/:id error:', err);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

export default router;
