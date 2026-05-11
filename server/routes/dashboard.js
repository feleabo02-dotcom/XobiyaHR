import { Router } from 'express';
import pool from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.get('/stats', verifyToken, async (req, res) => {
  try {
    const [[{ totalWorkers }]] = await pool.query('SELECT COUNT(*) as totalWorkers FROM workers');
    const [[{ activeWorkers }]] = await pool.query("SELECT COUNT(*) as activeWorkers FROM workers WHERE status = 'active'");
    const [[{ vacantPositions }]] = await pool.query("SELECT COUNT(*) as vacantPositions FROM positions WHERE status = 'vacant'");
    const [[{ totalPositions }]] = await pool.query('SELECT COUNT(*) as totalPositions FROM positions');
    const [[{ pendingAbsences }]] = await pool.query("SELECT COUNT(*) as pendingAbsences FROM absences WHERE status = 'pending'");
    const [[{ openRequisitions }]] = await pool.query("SELECT COUNT(*) as openRequisitions FROM requisitions WHERE status = 'open'");
    const [[{ totalAssignments }]] = await pool.query('SELECT COUNT(*) as totalAssignments FROM assignments');

    const [deptRows] = await pool.query(
      `SELECT COALESCE(department, 'Unassigned') as name, COUNT(*) as count
       FROM workers GROUP BY department ORDER BY count DESC`
    );

    const [recentAbsences] = await pool.query(
      `SELECT a.*, w.first_name, w.last_name
       FROM absences a JOIN workers w ON a.worker_id = w.id
       WHERE a.status = 'pending'
       ORDER BY a.created_at DESC LIMIT 5`
    );

    res.json({
      totalWorkers,
      activeWorkers,
      vacantPositions,
      totalPositions,
      pendingAbsences,
      openRequisitions,
      totalAssignments,
      departmentDistribution: deptRows,
      recentPendingAbsences: recentAbsences.map(r => ({
        id: String(r.id),
        workerName: `${r.first_name} ${r.last_name}`,
        type: r.type,
        startDate: r.start_date,
        endDate: r.end_date,
      })),
    });
  } catch (err) {
    console.error('GET /dashboard/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
