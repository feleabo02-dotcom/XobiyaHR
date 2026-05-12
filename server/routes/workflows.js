import { Router } from 'express';
import { verifyToken, requirePermission } from '../middleware/auth.js';
import { getWorkflowConfig } from '../services/workflow.js';

const router = Router();

router.get('/:module', verifyToken, requirePermission('system', 'read'), async (req, res) => {
  try {
    const data = await getWorkflowConfig(req.params.module);
    res.json(data);
  } catch (err) {
    console.error('GET /workflows/:module error:', err);
    res.status(500).json({ error: 'Failed to fetch workflow config' });
  }
});

export default router;
