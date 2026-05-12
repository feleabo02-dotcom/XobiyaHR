import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, requirePermission('hr', 'read'), async (req, res) => {
  try {
    const rows = await db('courses')
      .where('company_id', req.companyId)
      .orderBy('title');
    res.json(rows.map(r => ({
      id: String(r.id),
      title: r.title,
      description: r.description,
      type: r.type,
      provider: r.provider,
      durationHours: r.duration_hours,
      mandatory: Boolean(r.mandatory),
      status: r.status,
      createdAt: r.created_at,
    })));
  } catch (err) {
    console.error('GET /courses error:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

router.post('/', verifyToken, requirePermission('hr', 'create'), async (req, res) => {
  try {
    const { title, description, type, provider, durationHours, mandatory } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const [id] = await db('courses').insert({
      company_id: req.companyId,
      title,
      description: description || null,
      type: type || 'online',
      provider: provider || null,
      duration_hours: durationHours || null,
      mandatory: mandatory || false,
    });

    res.status(201).json({ id: String(id), message: 'Course created' });
  } catch (err) {
    console.error('POST /courses error:', err);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Enrollments
router.get('/enrollments', verifyToken, requirePermission('hr', 'read'), async (req, res) => {
  try {
    let query = db('enrollments')
      .join('courses', 'enrollments.course_id', 'courses.id')
      .join('workers', 'enrollments.worker_id', 'workers.id')
      .select(
        'enrollments.*',
        'courses.title as course_title',
        'courses.type as course_type',
        'courses.mandatory',
        db.raw('CONCAT(workers.first_name, " ", workers.last_name) as worker_name')
      )
      .where('enrollments.company_id', req.companyId);

    if (req.user.role === 'employee') {
      const worker = await db('workers').where({ user_id: req.user.id, company_id: req.companyId }).first();
      if (worker) query = query.where('enrollments.worker_id', worker.id);
      else return res.json([]);
    }

    const rows = await query.orderBy('enrollments.created_at', 'desc');
    res.json(rows.map(r => ({
      id: String(r.id),
      courseId: String(r.course_id),
      courseTitle: r.course_title,
      courseType: r.course_type,
      mandatory: Boolean(r.mandatory),
      workerId: String(r.worker_id),
      workerName: r.worker_name,
      enrollmentDate: r.enrollment_date,
      completionDate: r.completion_date,
      status: r.status,
      score: r.score,
      createdAt: r.created_at,
    })));
  } catch (err) {
    console.error('GET /courses/enrollments error:', err);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

router.post('/enroll', verifyToken, requirePermission('hr', 'read'), async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ error: 'courseId is required' });

    const worker = await db('workers').where({ user_id: req.user.id, company_id: req.companyId }).first();
    if (!worker) return res.status(400).json({ error: 'No worker profile linked' });

    const [id] = await db('enrollments').insert({
      company_id: req.companyId,
      course_id: courseId,
      worker_id: worker.id,
      enrollment_date: db.fn.now(),
      status: 'enrolled',
    });

    res.status(201).json({ id: String(id), message: 'Enrolled successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Already enrolled' });
    console.error('POST /courses/enroll error:', err);
    res.status(500).json({ error: 'Failed to enroll' });
  }
});

router.put('/enrollments/:id/progress', verifyToken, requirePermission('hr', 'update'), async (req, res) => {
  try {
    const { status, score } = req.body;
    await db('enrollments').where({ id: req.params.id }).update({
      status: status || 'in_progress',
      score: score ?? null,
      completion_date: status === 'completed' ? db.fn.now() : null,
      updated_at: db.fn.now(),
    });
    res.json({ message: 'Progress updated' });
  } catch (err) {
    console.error('PUT /courses/enrollments/:id/progress error:', err);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

export default router;
