import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, requirePermission('activity', 'read'), async (req, res) => {
  try {
    const rows = await db('activity_logs')
      .where({ company_id: req.companyId })
      .orderBy('created_at', 'desc')
      .limit(200);
    res.json(rows);
  } catch (err) {
    console.error('GET /activity error:', err);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

export default router;
