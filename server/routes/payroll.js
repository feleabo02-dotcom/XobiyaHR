import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/periods', verifyToken, requireRole('hr', 'payroll', 'finance'), async (req, res) => {
  try {
    const rows = await db('payroll_periods').orderBy('start_date', 'desc');
    res.json(rows.map(r => ({
      id: String(r.id),
      code: r.code,
      startDate: r.start_date,
      endDate: r.end_date,
      status: r.status,
      createdAt: r.created_at,
    })));
  } catch (err) {
    console.error('GET /payroll/periods error:', err);
    res.status(500).json({ error: 'Failed to fetch payroll periods' });
  }
});

router.get('/results', verifyToken, requireRole('hr', 'payroll', 'finance'), async (req, res) => {
  try {
    const rows = await db('payroll_results')
      .join('workers', 'payroll_results.worker_id', 'workers.id')
      .join('payroll_periods', 'payroll_results.payroll_period_id', 'payroll_periods.id')
      .select(
        'payroll_results.*',
        db.raw('CONCAT(workers.first_name, " ", workers.last_name) as worker_name'),
        'workers.department_id',
        'payroll_periods.code as period_code',
        'payroll_periods.start_date as period_start',
        'payroll_periods.end_date as period_end'
      )
      .orderBy('payroll_results.created_at', 'desc');

    res.json(rows.map(r => ({
      id: String(r.id),
      workerId: String(r.worker_id),
      workerName: r.worker_name,
      periodId: String(r.payroll_period_id),
      periodCode: r.period_code,
      periodStart: r.period_start,
      periodEnd: r.period_end,
      grossPay: r.gross_pay,
      deductions: r.deductions,
      netPay: r.net_pay,
      employerTax: r.employer_tax,
      employerBenefits: r.employer_benefits,
      currency: r.currency,
      status: r.status,
      createdAt: r.created_at,
    })));
  } catch (err) {
    console.error('GET /payroll/results error:', err);
    res.status(500).json({ error: 'Failed to fetch payroll results' });
  }
});

router.get('/journal', verifyToken, requireRole('hr', 'payroll', 'finance'), async (req, res) => {
  try {
    const rows = await db('payroll_journal')
      .join('payroll_results', 'payroll_journal.payroll_result_id', 'payroll_results.id')
      .join('workers', 'payroll_results.worker_id', 'workers.id')
      .select(
        'payroll_journal.*',
        db.raw('CONCAT(workers.first_name, " ", workers.last_name) as worker_name'),
        'payroll_results.payroll_period_id'
      )
      .orderBy('payroll_journal.created_at', 'desc')
      .limit(100);

    res.json(rows.map(r => ({
      id: String(r.id),
      payrollResultId: String(r.payroll_result_id),
      workerName: r.worker_name,
      glAccount: r.gl_account,
      debit: r.debit,
      credit: r.credit,
      costCenterId: r.cost_center_id,
      description: r.description,
      createdAt: r.created_at,
    })));
  } catch (err) {
    console.error('GET /payroll/journal error:', err);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

export default router;
