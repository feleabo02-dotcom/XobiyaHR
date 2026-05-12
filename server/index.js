import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import authRoutes from './routes/auth.js';
import workerRoutes from './routes/workers.js';
import departmentRoutes from './routes/departments.js';
import positionRoutes from './routes/positions.js';
import assignmentRoutes from './routes/assignments.js';
import absenceRoutes from './routes/absences.js';
import requisitionRoutes from './routes/requisitions.js';
import timesheetRoutes from './routes/timesheets.js';
import goalRoutes from './routes/goals.js';
import courseRoutes from './routes/courses.js';
import payrollRoutes from './routes/payroll.js';
import performanceRoutes from './routes/performance.js';
import dashboardRoutes from './routes/dashboard.js';
import notificationRoutes from './routes/notifications.js';
import companyRoutes from './routes/companies.js';
import assetRoutes from './routes/assets.js';
import inventoryRoutes from './routes/inventory.js';
import procurementRoutes from './routes/procurement.js';
import salesRoutes from './routes/sales.js';
import accountingRoutes from './routes/accounting.js';
import projectRoutes from './routes/projects.js';
import attachmentRoutes from './routes/attachments.js';
import activityRoutes from './routes/activity.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/absences', absenceRoutes);
app.use('/api/requisitions', requisitionRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/activity', activityRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'xobiya-hr-api', version: '1.0.0' }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Xobiya HR API running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
