import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    let query = db('goals')
      .join('workers', 'goals.worker_id', 'workers.id')
      .select('goals.*', db.raw('CONCAT(workers.first_name, " ", workers.last_name) as worker_name'))
      .where('goals.company_id', req.companyId);

    if (req.user.role === 'employee') {
      const worker = await db('workers').where({ user_id: req.user.id, company_id: req.companyId }).first();
      if (worker) query = query.where('goals.worker_id', worker.id);
      else return res.json([]);
    } else if (req.user.role === 'manager') {
      const worker = await db('workers').where({ user_id: req.user.id, company_id: req.companyId }).first();
      if (worker) {
        query = query.where(function () {
          this.where('goals.worker_id', worker.id)
            .orWhereIn('goals.worker_id', function () {
              this.select('worker_id').from('assignments').where('manager_id', worker.id).andWhere('company_id', req.companyId);
            });
        });
      }
    }

    if (req.query.workerId) query = query.where('goals.worker_id', req.query.workerId);
    if (req.query.status) query = query.where('goals.status', req.query.status);

    const rows = await query.orderBy('goals.created_at', 'desc');
    res.json(rows.map(r => ({
      id: String(r.id),
      workerId: String(r.worker_id),
      workerName: r.worker_name,
      title: r.title,
      description: r.description,
      type: r.type,
      status: r.status,
      startDate: r.start_date,
      endDate: r.end_date,
      weight: r.weight,
      progress: r.progress,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })));
  } catch (err) {
    console.error('GET /goals error:', err);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

router.post('/', verifyToken, requireRole('hr', 'manager'), async (req, res) => {
  try {
    const { workerId, title, description, type, startDate, endDate, weight } = req.body;
    if (!workerId || !title) return res.status(400).json({ error: 'workerId and title are required' });

    const [id] = await db('goals').insert({
      company_id: req.companyId,
      worker_id: workerId,
      title,
      description: description || null,
      type: type || 'okr',
      status: 'draft',
      start_date: startDate || null,
      end_date: endDate || null,
      weight: weight || 1.0,
      created_by: req.user.id,
    });

    res.status(201).json({ id: String(id), message: 'Goal created' });
  } catch (err) {
    console.error('POST /goals error:', err);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { title, description, status, progress, endDate } = req.body;
    const existing = await db('goals').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!existing) return res.status(404).json({ error: 'Goal not found' });

    await db('goals').where({ id: req.params.id }).update({
      title: title ?? existing.title,
      description: description ?? existing.description,
      status: status ?? existing.status,
      progress: progress ?? existing.progress,
      end_date: endDate ?? existing.end_date,
      updated_at: db.fn.now(),
    });

    res.json({ message: 'Goal updated' });
  } catch (err) {
    console.error('PUT /goals/:id error:', err);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

router.delete('/:id', verifyToken, requireRole('hr', 'manager'), async (req, res) => {
  try {
    await db('goals').where({ id: req.params.id, company_id: req.companyId }).del();
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    console.error('DELETE /goals/:id error:', err);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

export default router;
