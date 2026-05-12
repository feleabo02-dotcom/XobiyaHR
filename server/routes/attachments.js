import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, requirePermission('attachments', 'read'), async (req, res) => {
  try {
    const { refType, refId } = req.query;
    const query = db('attachments').where({ company_id: req.companyId });
    if (refType) query.andWhere('ref_type', String(refType));
    if (refId) query.andWhere('ref_id', String(refId));
    const rows = await query.orderBy('created_at', 'desc');
    res.json(rows);
  } catch (err) {
    console.error('GET /attachments error:', err);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

router.post('/', verifyToken, requirePermission('attachments', 'create'), async (req, res) => {
  try {
    const { refType, refId, fileName, fileUrl, mimeType } = req.body;
    if (!refType || !refId || !fileName || !fileUrl) {
      return res.status(400).json({ error: 'refType, refId, fileName, and fileUrl are required' });
    }

    const [id] = await db('attachments').insert({
      company_id: req.companyId,
      ref_type: refType,
      ref_id: String(refId),
      file_name: fileName,
      file_url: fileUrl,
      mime_type: mimeType || null,
      uploaded_by: req.user.id,
    });

    const row = await db('attachments').where({ id }).first();
    res.status(201).json(row);
  } catch (err) {
    console.error('POST /attachments error:', err);
    res.status(500).json({ error: 'Failed to create attachment' });
  }
});

export default router;
