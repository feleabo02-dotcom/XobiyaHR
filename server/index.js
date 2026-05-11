import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import authRoutes from './routes/auth.js';
import workerRoutes from './routes/workers.js';
import positionRoutes from './routes/positions.js';
import absenceRoutes from './routes/absences.js';
import assignmentRoutes from './routes/assignments.js';
import requisitionRoutes from './routes/requisitions.js';
import timesheetRoutes from './routes/timesheets.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/absences', absenceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/requisitions', requisitionRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'xobiya-hr-api' }));

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Xobiya HR API running on http://localhost:${PORT}`);
});
