import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const rows = await db('workers')
      .leftJoin('departments', 'workers.department_id', 'departments.id')
      .leftJoin('compensation_grades', 'workers.grade_id', 'compensation_grades.id')
      .select(
        'workers.*',
        'departments.name as department_name',
        'departments.code as department_code',
        'compensation_grades.code as grade_code'
      )
      .orderBy('workers.last_name');

    res.json(rows.map(mapWorker));
  } catch (err) {
    console.error('GET /workers error:', err);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const row = await db('workers')
      .leftJoin('departments', 'workers.department_id', 'departments.id')
      .leftJoin('compensation_grades', 'workers.grade_id', 'compensation_grades.id')
      .select('workers.*', 'departments.name as department_name', 'compensation_grades.code as grade_code')
      .where('workers.id', req.params.id)
      .first();

    if (!row) return res.status(404).json({ error: 'Worker not found' });
    res.json(mapWorker(row));
  } catch (err) {
    console.error('GET /workers/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch worker' });
  }
});

router.post('/', verifyToken, requireRole('hr', 'manager'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, workerType, hireDate, status, departmentId, jobTitle, employeeId } = req.body;
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'firstName, lastName, and email are required' });
    }

    const [id] = await db('workers').insert({
      employee_id: employeeId || null,
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || null,
      worker_type: workerType || 'employee',
      hire_date: hireDate || null,
      status: status || 'onboarding',
      department_id: departmentId || null,
      job_title: jobTitle || null,
    });

    const row = await db('workers').where({ id }).first();
    res.status(201).json(mapWorker(row));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'A worker with this email already exists' });
    console.error('POST /workers error:', err);
    res.status(500).json({ error: 'Failed to create worker' });
  }
});

router.put('/:id', verifyToken, requireRole('hr', 'manager'), async (req, res) => {
  try {
    const existing = await db('workers').where({ id: req.params.id }).first();
    if (!existing) return res.status(404).json({ error: 'Worker not found' });

    const { firstName, lastName, email, phone, workerType, hireDate, status, departmentId, jobTitle } = req.body;
    await db('workers').where({ id: req.params.id }).update({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      worker_type: workerType,
      hire_date: hireDate,
      status,
      department_id: departmentId,
      job_title: jobTitle,
      updated_at: db.fn.now(),
    });

    const row = await db('workers').where({ id: req.params.id }).first();
    res.json(mapWorker(row));
  } catch (err) {
    console.error('PUT /workers/:id error:', err);
    res.status(500).json({ error: 'Failed to update worker' });
  }
});

router.delete('/:id', verifyToken, requireRole('hr'), async (req, res) => {
  try {
    const deleted = await db('workers').where({ id: req.params.id }).del();
    if (!deleted) return res.status(404).json({ error: 'Worker not found' });
    res.json({ message: 'Worker deleted' });
  } catch (err) {
    console.error('DELETE /workers/:id error:', err);
    res.status(500).json({ error: 'Failed to delete worker' });
  }
});

function mapWorker(row) {
  return {
    id: String(row.id),
    employeeId: row.employee_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    workerType: row.worker_type,
    hireDate: row.hire_date,
    terminationDate: row.termination_date,
    status: row.status,
    departmentId: row.department_id ? String(row.department_id) : null,
    departmentName: row.department_name,
    departmentCode: row.department_code,
    jobTitle: row.job_title,
    gradeId: row.grade_id ? String(row.grade_id) : null,
    gradeCode: row.grade_code,
    photoUrl: row.photo_url,
    timezone: row.timezone,
    userId: row.user_id ? String(row.user_id) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default router;
