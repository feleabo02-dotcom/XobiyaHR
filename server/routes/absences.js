import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, requirePermission('attendance', 'read'), async (req, res) => {
  try {
    let query = db('absences')
      .join('workers', 'absences.worker_id', 'workers.id')
      .join('absence_types', 'absences.absence_type_id', 'absence_types.id')
      .select(
        'absences.*',
        db.raw('CONCAT(workers.first_name, " ", workers.last_name) as worker_name'),
        'absence_types.code as absence_type_code',
        'absence_types.label as absence_type_label'
      )
      .where('absences.company_id', req.companyId)
      .orderBy('absences.created_at', 'desc');

    if (req.user.role === 'employee') {
      const worker = await db('workers').where({ user_id: req.user.id, company_id: req.companyId }).first();
      if (worker) query = query.where('absences.worker_id', worker.id);
      else return res.json([]);
    }

    const rows = await query;
    res.json(rows.map(r => ({
      id: String(r.id),
      workerId: String(r.worker_id),
      workerName: r.worker_name,
      absenceTypeId: String(r.absence_type_id),
      absenceTypeCode: r.absence_type_code,
      absenceTypeLabel: r.absence_type_label,
      startDate: r.start_date,
      endDate: r.end_date,
      durationDays: r.duration_days,
      status: r.status,
      reason: r.reason,
      approvedBy: r.approved_by ? String(r.approved_by) : null,
      createdAt: r.created_at,
    })));
  } catch (err) {
    console.error('GET /absences error:', err);
    res.status(500).json({ error: 'Failed to fetch absences' });
  }
});

router.post('/', verifyToken, requirePermission('attendance', 'create'), async (req, res) => {
  try {
    const { absenceTypeId, startDate, endDate, reason } = req.body;
    if (!absenceTypeId || !startDate || !endDate) {
      return res.status(400).json({ error: 'absenceTypeId, startDate, and endDate are required' });
    }

    const worker = await db('workers').where({ user_id: req.user.id, company_id: req.companyId }).first();
    if (!worker) return res.status(400).json({ error: 'No worker profile linked to your account' });

    const s = new Date(startDate), e = new Date(endDate);
    const duration = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const [id] = await db('absences').insert({
      company_id: req.companyId,
      worker_id: worker.id,
      absence_type_id: absenceTypeId,
      start_date: startDate,
      end_date: endDate,
      duration_days: duration,
      reason: reason || null,
      status: 'pending',
    });

    // Update pending balance
    const bal = await db('leave_balances')
      .where({ worker_id: worker.id, absence_type_id: absenceTypeId, year: new Date().getFullYear() })
      .first();
    if (bal) {
      await db('leave_balances').where({ id: bal.id }).update({
        total_pending: db.raw('total_pending + ?', [duration]),
        updated_at: db.fn.now(),
      });
    }

    res.status(201).json({ id: String(id), message: 'Absence request created' });
  } catch (err) {
    console.error('POST /absences error:', err);
    res.status(500).json({ error: 'Failed to create absence' });
  }
});

router.put('/:id/status', verifyToken, requirePermission('attendance', 'approve'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
    }

    const existing = await db('absences').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!existing) return res.status(404).json({ error: 'Absence not found' });

    await db('absences').where({ id: req.params.id }).update({
      status,
      approved_by: req.user.id,
      updated_at: db.fn.now(),
    });

    if (status === 'approved') {
      await db('leave_balances')
        .where({ worker_id: existing.worker_id, absence_type_id: existing.absence_type_id, year: new Date().getFullYear() })
        .update({ total_taken: db.raw('total_taken + ?', [existing.duration_days]), total_pending: db.raw('GREATEST(total_pending - ?, 0)', [existing.duration_days]), updated_at: db.fn.now() });
    } else if (status === 'rejected') {
      await db('leave_balances')
        .where({ worker_id: existing.worker_id, absence_type_id: existing.absence_type_id, year: new Date().getFullYear() })
        .update({ total_pending: db.raw('GREATEST(total_pending - ?, 0)', [existing.duration_days]), updated_at: db.fn.now() });
    }

    res.json({ message: `Absence ${status}` });
  } catch (err) {
    console.error('PUT /absences/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update absence status' });
  }
});

router.put('/:id/cancel', verifyToken, requirePermission('attendance', 'update'), async (req, res) => {
  try {
    const absence = await db('absences')
      .join('workers', 'absences.worker_id', 'workers.id')
      .select('absences.*')
      .where('absences.id', req.params.id)
      .andWhere('absences.company_id', req.companyId)
      .andWhere('workers.user_id', req.user.id)
      .first();

    if (!absence) return res.status(404).json({ error: 'Absence not found or not yours' });

    await db('absences').where({ id: req.params.id }).update({ status: 'cancelled', updated_at: db.fn.now() });

    if (absence.status === 'pending') {
      await db('leave_balances')
        .where({ worker_id: absence.worker_id, absence_type_id: absence.absence_type_id, year: new Date().getFullYear() })
        .update({ total_pending: db.raw('GREATEST(total_pending - ?, 0)', [absence.duration_days]), updated_at: db.fn.now() });
    }

    res.json({ message: 'Absence cancelled' });
  } catch (err) {
    console.error('PUT /absences/:id/cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel absence' });
  }
});

// Get absence types
router.get('/types', verifyToken, requirePermission('attendance', 'read'), async (req, res) => {
  try {
    const types = await db('absence_types').where({ company_id: req.companyId }).orderBy('label');
    res.json(types.map(t => ({
      id: String(t.id),
      code: t.code,
      label: t.label,
      paid: Boolean(t.paid),
      defaultEntitlement: t.default_entitlement,
      carryoverAllowed: Boolean(t.carryover_allowed),
      maxCarryover: t.max_carryover,
    })));
  } catch (err) {
    console.error('GET /absences/types error:', err);
    res.status(500).json({ error: 'Failed to fetch absence types' });
  }
});

// Get leave balances for current user
router.get('/balances', verifyToken, requirePermission('attendance', 'read'), async (req, res) => {
  try {
    const worker = await db('workers').where({ user_id: req.user.id, company_id: req.companyId }).first();
    if (!worker) return res.json([]);

    const balances = await db('leave_balances')
      .join('absence_types', 'leave_balances.absence_type_id', 'absence_types.id')
      .select('leave_balances.*', 'absence_types.code', 'absence_types.label', 'absence_types.paid')
      .where('leave_balances.worker_id', worker.id)
      .andWhere('leave_balances.company_id', req.companyId);

    res.json(balances.map(b => ({
      id: String(b.id),
      absenceTypeCode: b.code,
      absenceTypeLabel: b.label,
      paid: Boolean(b.paid),
      totalEntitled: b.total_entitled,
      totalTaken: b.total_taken,
      totalPending: b.total_pending,
      remaining: b.total_entitled - b.total_taken,
      year: b.year,
    })));
  } catch (err) {
    console.error('GET /absences/balances error:', err);
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

export default router;
