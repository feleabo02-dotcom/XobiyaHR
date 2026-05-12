import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const rows = await db('departments')
      .leftJoin('workers', 'departments.manager_id', 'workers.id')
      .select('departments.*', db.raw('CONCAT(workers.first_name, " ", workers.last_name) as manager_name'))
      .where('departments.company_id', req.companyId)
      .orderBy('departments.name');
    res.json(rows.map(r => ({
      id: String(r.id),
      name: r.name,
      code: r.code,
      costCenterId: r.cost_center_id,
      managerId: r.manager_id ? String(r.manager_id) : null,
      managerName: r.manager_name,
      parentDepartmentId: r.parent_department_id ? String(r.parent_department_id) : null,
      isActive: Boolean(r.is_active),
      createdAt: r.created_at,
    })));
  } catch (err) {
    console.error('GET /departments error:', err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

router.post('/', verifyToken, requireRole('hr'), async (req, res) => {
  try {
    const { name, code, costCenterId, managerId, parentDepartmentId } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'name and code are required' });

    const [id] = await db('departments').insert({
      company_id: req.companyId,
      name, code,
      cost_center_id: costCenterId || null,
      manager_id: managerId || null,
      parent_department_id: parentDepartmentId || null,
    });
    const row = await db('departments').where({ id }).first();
    res.status(201).json({ id: String(row.id), name: row.name, code: row.code, costCenterId: row.cost_center_id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Department code or name already exists' });
    console.error('POST /departments error:', err);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

router.put('/:id', verifyToken, requireRole('hr'), async (req, res) => {
  try {
    const { name, code, costCenterId, managerId, isActive } = req.body;
    await db('departments').where({ id: req.params.id, company_id: req.companyId }).update({
      name, code,
      cost_center_id: costCenterId,
      manager_id: managerId,
      is_active: isActive,
    });
    res.json({ message: 'Department updated' });
  } catch (err) {
    console.error('PUT /departments/:id error:', err);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

export default router;
