import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, requirePermission('hr', 'read'), async (req, res) => {
  try {
    const rows = await db('positions')
      .leftJoin('departments', 'positions.department_id', 'departments.id')
      .leftJoin('compensation_grades', 'positions.grade_id', 'compensation_grades.id')
      .select(
        'positions.*',
        'departments.name as department_name',
        'compensation_grades.code as grade_code',
        'compensation_grades.title as grade_title'
      )
      .where('positions.company_id', req.companyId)
      .orderBy('positions.title');

    res.json(rows.map(r => ({
      id: String(r.id),
      title: r.title,
      gradeId: r.grade_id ? String(r.grade_id) : null,
      gradeCode: r.grade_code,
      gradeTitle: r.grade_title,
      costCenterId: r.cost_center_id,
      departmentId: r.department_id ? String(r.department_id) : null,
      departmentName: r.department_name,
      location: r.location,
      fte: r.fte,
      budgetedSalary: r.budgeted_salary,
      status: r.status,
      description: r.description,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })));
  } catch (err) {
    console.error('GET /positions error:', err);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

router.get('/:id', verifyToken, requirePermission('hr', 'read'), async (req, res) => {
  try {
    const row = await db('positions').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!row) return res.status(404).json({ error: 'Position not found' });
    res.json(row);
  } catch (err) {
    console.error('GET /positions/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch position' });
  }
});

router.post('/', verifyToken, requirePermission('hr', 'create'), async (req, res) => {
  try {
    const { title, gradeId, costCenterId, departmentId, location, fte, budgetedSalary, status, description } = req.body;
    if (!title || !costCenterId) return res.status(400).json({ error: 'title and costCenterId are required' });

    const [id] = await db('positions').insert({
      company_id: req.companyId,
      title,
      grade_id: gradeId || null,
      cost_center_id: costCenterId,
      department_id: departmentId || null,
      location: location || null,
      fte: fte || 1.0,
      budgeted_salary: budgetedSalary || null,
      status: status || 'vacant',
      description: description || null,
    });

    const row = await db('positions').where({ id }).first();
    res.status(201).json({ id: String(row.id), ...row });
  } catch (err) {
    console.error('POST /positions error:', err);
    res.status(500).json({ error: 'Failed to create position' });
  }
});

router.put('/:id', verifyToken, requirePermission('hr', 'update'), async (req, res) => {
  try {
    const { title, gradeId, costCenterId, departmentId, location, fte, budgetedSalary, status, description } = req.body;
    const existing = await db('positions').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!existing) return res.status(404).json({ error: 'Position not found' });

    await db('positions').where({ id: req.params.id }).update({
      title, grade_id: gradeId, cost_center_id: costCenterId,
      department_id: departmentId, location, fte, budgeted_salary: budgetedSalary,
      status, description,
      updated_at: db.fn.now(),
    });
    res.json({ message: 'Position updated' });
  } catch (err) {
    console.error('PUT /positions/:id error:', err);
    res.status(500).json({ error: 'Failed to update position' });
  }
});

router.delete('/:id', verifyToken, requirePermission('hr', 'delete'), async (req, res) => {
  try {
    const deleted = await db('positions').where({ id: req.params.id, company_id: req.companyId }).del();
    if (!deleted) return res.status(404).json({ error: 'Position not found' });
    res.json({ message: 'Position deleted' });
  } catch (err) {
    console.error('DELETE /positions/:id error:', err);
    res.status(500).json({ error: 'Failed to delete position' });
  }
});

export default router;
