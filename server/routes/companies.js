import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, requirePermission('system', 'read'), async (_req, res) => {
  try {
    const rows = await db('companies').orderBy('name');
    res.json(rows);
  } catch (err) {
    console.error('GET /companies error:', err);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

router.post('/', verifyToken, requirePermission('system', 'manage'), async (req, res) => {
  try {
    const { name, code, currency, timezone } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'name and code are required' });

    const [id] = await db('companies').insert({
      name,
      code,
      currency: currency || 'USD',
      timezone: timezone || 'UTC',
      is_active: true,
    });

    const row = await db('companies').where({ id }).first();
    res.status(201).json(row);
  } catch (err) {
    console.error('POST /companies error:', err);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

router.put('/:id', verifyToken, requirePermission('system', 'manage'), async (req, res) => {
  try {
    const { name, code, currency, timezone, isActive } = req.body;
    await db('companies').where({ id: req.params.id }).update({
      name,
      code,
      currency,
      timezone,
      is_active: isActive,
      updated_at: db.fn.now(),
    });
    const row = await db('companies').where({ id: req.params.id }).first();
    res.json(row);
  } catch (err) {
    console.error('PUT /companies error:', err);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

export default router;
