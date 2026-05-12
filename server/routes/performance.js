import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, requirePermission('hr', 'read'), async (req, res) => {
  try {
    let query = db('performance_reviews')
      .join('workers as w', 'performance_reviews.worker_id', 'w.id')
      .join('workers as r', 'performance_reviews.reviewer_id', 'r.id')
      .select(
        'performance_reviews.*',
        db.raw('CONCAT(w.first_name, " ", w.last_name) as worker_name'),
        db.raw('CONCAT(r.first_name, " ", r.last_name) as reviewer_name')
      )
      .where('performance_reviews.company_id', req.companyId);

    if (req.user.role === 'employee') {
      const worker = await db('workers').where({ user_id: req.user.id, company_id: req.companyId }).first();
      if (worker) query = query.where('performance_reviews.worker_id', worker.id);
      else return res.json([]);
    }

    const rows = await query.orderBy('performance_reviews.created_at', 'desc');
    res.json(rows.map(r => ({
      id: String(r.id),
      workerId: String(r.worker_id),
      workerName: r.worker_name,
      reviewerId: String(r.reviewer_id),
      reviewerName: r.reviewer_name,
      title: r.title,
      type: r.type,
      status: r.status,
      overallRating: r.overall_rating,
      summary: r.summary,
      reviewDate: r.review_date,
      createdAt: r.created_at,
    })));
  } catch (err) {
    console.error('GET /performance error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.post('/', verifyToken, requirePermission('hr', 'create'), async (req, res) => {
  try {
    const { workerId, title, type, reviewDate } = req.body;
    if (!workerId || !title) return res.status(400).json({ error: 'workerId and title are required' });

    const [id] = await db('performance_reviews').insert({
      company_id: req.companyId,
      worker_id: workerId,
      reviewer_id: req.user.id,
      title,
      type: type || 'annual',
      status: 'draft',
      review_date: reviewDate || null,
    });

    res.status(201).json({ id: String(id), message: 'Review created' });
  } catch (err) {
    console.error('POST /performance error:', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

router.put('/:id', verifyToken, requirePermission('hr', 'update'), async (req, res) => {
  try {
    const { status, overallRating, summary, reviewDate } = req.body;
    await db('performance_reviews').where({ id: req.params.id, company_id: req.companyId }).update({
      status: status || 'draft',
      overall_rating: overallRating ?? null,
      summary: summary ?? null,
      review_date: reviewDate ?? null,
      updated_at: db.fn.now(),
    });
    res.json({ message: 'Review updated' });
  } catch (err) {
    console.error('PUT /performance/:id error:', err);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

export default router;
