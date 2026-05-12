import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/stats', verifyToken, async (req, res) => {
  try {
    const companyId = req.companyId;
    const [totalWorkers] = await db('workers').where('company_id', companyId).count('* as count');
    const [activeWorkers] = await db('workers').where({ status: 'active', company_id: companyId }).count('* as count');
    const [onboardingWorkers] = await db('workers').where({ status: 'onboarding', company_id: companyId }).count('* as count');
    const [totalPositions] = await db('positions').where('company_id', companyId).count('* as count');
    const [vacantPositions] = await db('positions').where({ status: 'vacant', company_id: companyId }).count('* as count');
    const [filledPositions] = await db('positions').where({ status: 'filled', company_id: companyId }).count('* as count');
    const [pendingAbsences] = await db('absences').where({ status: 'pending', company_id: companyId }).count('* as count');
    const [openRequisitions] = await db('requisitions').where({ status: 'open', company_id: companyId }).count('* as count');
    const [activeAssignments] = await db('assignments').whereNull('end_date').andWhere('company_id', companyId).count('* as count');
    const [pendingTimesheets] = await db('timesheets').where({ status: 'submitted', company_id: companyId }).count('* as count');
    const [totalCourses] = await db('courses').where({ status: 'active', company_id: companyId }).count('* as count');
    const [totalGoals] = await db('goals').where({ status: 'active', company_id: companyId }).count('* as count');
    const [upcomingReviews] = await db('performance_reviews').where({ status: 'in_progress', company_id: companyId }).count('* as count');

    const payrollSummary = await db('payroll_results')
      .join('payroll_periods', 'payroll_results.payroll_period_id', 'payroll_periods.id')
      .where('payroll_periods.status', 'closed')
      .andWhere('payroll_results.company_id', companyId)
      .sum('gross_pay as total_gross')
      .sum('net_pay as total_net')
      .sum('employer_tax as total_tax')
      .sum('employer_benefits as total_benefits')
      .first();

    const departmentDistribution = await db('workers')
      .join('departments', 'workers.department_id', 'departments.id')
      .select('departments.name', 'departments.code')
      .count('* as count')
      .where('workers.company_id', companyId)
      .groupBy('departments.id', 'departments.name', 'departments.code')
      .orderBy('count', 'desc');

    const recentAbsences = await db('absences')
      .join('workers', 'absences.worker_id', 'workers.id')
      .join('absence_types', 'absences.absence_type_id', 'absence_types.id')
      .select(
        'absences.id',
        db.raw('CONCAT(workers.first_name, " ", workers.last_name) as worker_name'),
        'absence_types.label as absence_label',
        'absences.start_date',
        'absences.end_date',
        'absences.status',
        'absences.duration_days'
      )
      .where('absences.status', 'pending')
      .andWhere('absences.company_id', companyId)
      .orderBy('absences.created_at', 'desc')
      .limit(5);

    const workerTypeDist = await db('workers')
      .select('worker_type')
      .count('* as count')
      .where('company_id', companyId)
      .groupBy('worker_type');

    res.json({
      totalWorkers: Number(totalWorkers.count),
      activeWorkers: Number(activeWorkers.count),
      onboardingWorkers: Number(onboardingWorkers.count),
      totalPositions: Number(totalPositions.count),
      vacantPositions: Number(vacantPositions.count),
      filledPositions: Number(filledPositions.count),
      pendingAbsences: Number(pendingAbsences.count),
      openRequisitions: Number(openRequisitions.count),
      activeAssignments: Number(activeAssignments.count),
      pendingTimesheets: Number(pendingTimesheets.count),
      totalCourses: Number(totalCourses.count),
      totalGoals: Number(totalGoals.count),
      upcomingReviews: Number(upcomingReviews.count),
      payrollSummary: {
        totalGross: payrollSummary?.total_gross || 0,
        totalNet: payrollSummary?.total_net || 0,
        totalTax: payrollSummary?.total_tax || 0,
        totalBenefits: payrollSummary?.total_benefits || 0,
      },
      departmentDistribution: departmentDistribution.map(d => ({
        name: d.name,
        code: d.code,
        count: Number(d.count),
      })),
      workerTypeDistribution: workerTypeDist.map(d => ({
        type: d.worker_type,
        count: Number(d.count),
      })),
      recentPendingAbsences: recentAbsences.map(a => ({
        id: String(a.id),
        workerName: a.worker_name,
        absenceLabel: a.absence_label,
        startDate: a.start_date,
        endDate: a.end_date,
        durationDays: a.duration_days,
        status: a.status,
      })),
    });
  } catch (err) {
    console.error('GET /dashboard/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

router.get('/erp-bridge', verifyToken, requireRole('hr', 'finance'), async (req, res) => {
  try {
    const companyId = req.companyId;
    const openReqs = await db('requisitions').where({ status: 'open', company_id: companyId }).count('* as count');
    const payrollSummary = await db('payroll_results')
      .join('payroll_periods', 'payroll_results.payroll_period_id', 'payroll_periods.id')
      .where('payroll_periods.status', 'closed')
      .andWhere('payroll_results.company_id', companyId)
      .sum('gross_pay as gross')
      .sum('employer_tax as tax')
      .sum('employer_benefits as benefits')
      .first();

    res.json({
      openRequisitionsBudget: openReqs.count,
      lastPayrollGross: payrollSummary?.gross || 0,
      lastPayrollTax: payrollSummary?.tax || 0,
      lastPayrollBenefits: payrollSummary?.benefits || 0,
    });
  } catch (err) {
    console.error('GET /dashboard/erp-bridge error:', err);
    res.status(500).json({ error: 'Failed to fetch ERP bridge data' });
  }
});

export default router;
