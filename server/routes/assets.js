import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';
import { logAudit, logStatusChange } from '../services/audit.js';
import { assertWorkflowTransition } from '../services/workflow.js';

const router = Router();

router.get('/', verifyToken, requirePermission('assets', 'read'), async (req, res) => {
  try {
    const rows = await db('assets')
      .where({ company_id: req.companyId })
      .orderBy('created_at', 'desc');
    res.json(rows);
  } catch (err) {
    console.error('GET /assets error:', err);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

router.post('/', verifyToken, requirePermission('assets', 'create'), async (req, res) => {
  try {
    const { assetTag, name, category, purchaseDate, purchaseCost, depreciationMethod, depreciationYears, notes } = req.body;
    if (!assetTag || !name) return res.status(400).json({ error: 'assetTag and name are required' });

    const [id] = await db('assets').insert({
      company_id: req.companyId,
      asset_tag: assetTag,
      name,
      category: category || null,
      purchase_date: purchaseDate || null,
      purchase_cost: purchaseCost || null,
      depreciation_method: depreciationMethod || 'straight_line',
      depreciation_years: depreciationYears || null,
      notes: notes || null,
    });

    const row = await db('assets').where({ id }).first();
    await logAudit({
      companyId: req.companyId,
      userId: req.user.id,
      action: 'create',
      tableName: 'assets',
      recordId: id,
      newData: row,
    });

    res.status(201).json(row);
  } catch (err) {
    console.error('POST /assets error:', err);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

router.put('/:id', verifyToken, requirePermission('assets', 'update'), async (req, res) => {
  try {
    const existing = await db('assets').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!existing) return res.status(404).json({ error: 'Asset not found' });

    const { name, category, status, notes } = req.body;
    await db('assets').where({ id: req.params.id }).update({
      name: name || existing.name,
      category: category || existing.category,
      status: status || existing.status,
      notes: notes || existing.notes,
      updated_at: db.fn.now(),
    });

    const row = await db('assets').where({ id: req.params.id }).first();
    await logAudit({
      companyId: req.companyId,
      userId: req.user.id,
      action: 'update',
      tableName: 'assets',
      recordId: req.params.id,
      oldData: existing,
      newData: row,
    });

    if (status && status !== existing.status) {
      await logStatusChange({
        companyId: req.companyId,
        refType: 'asset',
        refId: req.params.id,
        fromStatus: existing.status,
        toStatus: status,
        userId: req.user.id,
      });
    }

    res.json(row);
  } catch (err) {
    console.error('PUT /assets/:id error:', err);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

router.post('/:id/assign', verifyToken, requirePermission('assets', 'assign'), async (req, res) => {
  try {
    const asset = await db('assets').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    await assertWorkflowTransition({
      module: 'asset',
      fromStatus: asset.status,
      toStatus: 'assigned',
      action: 'assign',
      user: req.user,
    });

    const { workerId, startDate, notes } = req.body;
    if (!workerId || !startDate) {
      return res.status(400).json({ error: 'workerId and startDate are required' });
    }

    const [assignmentId] = await db('asset_assignments').insert({
      company_id: req.companyId,
      asset_id: asset.id,
      worker_id: workerId,
      assigned_by: req.user.id,
      start_date: startDate,
      status: 'assigned',
      notes: notes || null,
    });

    await db('assets').where({ id: asset.id }).update({ status: 'assigned', updated_at: db.fn.now() });

    await logStatusChange({
      companyId: req.companyId,
      refType: 'asset',
      refId: asset.id,
      fromStatus: asset.status,
      toStatus: 'assigned',
      userId: req.user.id,
    });

    const assignment = await db('asset_assignments').where({ id: assignmentId }).first();
    res.status(201).json(assignment);
  } catch (err) {
    console.error('POST /assets/:id/assign error:', err);
    res.status(500).json({ error: 'Failed to assign asset' });
  }
});

router.post('/:id/return', verifyToken, requirePermission('assets', 'assign'), async (req, res) => {
  try {
    const asset = await db('assets').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    await assertWorkflowTransition({
      module: 'asset',
      fromStatus: asset.status,
      toStatus: 'available',
      action: 'return',
      user: req.user,
    });

    const activeAssignment = await db('asset_assignments')
      .where({ asset_id: asset.id, status: 'assigned' })
      .orderBy('created_at', 'desc')
      .first();

    if (!activeAssignment) return res.status(409).json({ error: 'Asset is not assigned' });

    await db('asset_assignments').where({ id: activeAssignment.id }).update({
      status: 'returned',
      end_date: req.body.endDate || new Date(),
      updated_at: db.fn.now(),
    });

    await db('assets').where({ id: asset.id }).update({ status: 'available', updated_at: db.fn.now() });

    await logStatusChange({
      companyId: req.companyId,
      refType: 'asset',
      refId: asset.id,
      fromStatus: asset.status,
      toStatus: 'available',
      userId: req.user.id,
    });

    res.json({ message: 'Asset returned' });
  } catch (err) {
    console.error('POST /assets/:id/return error:', err);
    res.status(500).json({ error: 'Failed to return asset' });
  }
});

export default router;
