import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';
import { logStatusChange } from '../services/audit.js';

const router = Router();

router.get('/projects', verifyToken, requirePermission('projects', 'read'), async (req, res) => {
  try {
    const rows = await db('projects').where({ company_id: req.companyId }).orderBy('created_at', 'desc');
    res.json(rows);
  } catch (err) {
    console.error('GET /projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.post('/projects', verifyToken, requirePermission('projects', 'create'), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const [id] = await db('projects').insert({
      company_id: req.companyId,
      name,
      description: description || null,
      status: 'planned',
    });

    const row = await db('projects').where({ id }).first();
    res.status(201).json(row);
  } catch (err) {
    console.error('POST /projects error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.put('/projects/:id/status', verifyToken, requirePermission('projects', 'update'), async (req, res) => {
  try {
    const { status } = req.body;
    const existing = await db('projects').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!existing) return res.status(404).json({ error: 'Project not found' });

    await db('projects').where({ id: req.params.id }).update({ status, updated_at: db.fn.now() });
    await logStatusChange({
      companyId: req.companyId,
      refType: 'project',
      refId: req.params.id,
      fromStatus: existing.status,
      toStatus: status,
      userId: req.user.id,
    });

    const row = await db('projects').where({ id: req.params.id }).first();
    res.json(row);
  } catch (err) {
    console.error('PUT /projects/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update project status' });
  }
});

router.get('/tasks', verifyToken, requirePermission('projects', 'read'), async (req, res) => {
  try {
    const rows = await db('tasks').where({ company_id: req.companyId }).orderBy('created_at', 'desc');
    res.json(rows);
  } catch (err) {
    console.error('GET /tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/tasks', verifyToken, requirePermission('projects', 'create'), async (req, res) => {
  try {
    const { projectId, title, description, assigneeId, dueDate } = req.body;
    if (!projectId || !title) return res.status(400).json({ error: 'projectId and title are required' });

    const [id] = await db('tasks').insert({
      company_id: req.companyId,
      project_id: projectId,
      title,
      description: description || null,
      assignee_id: assigneeId || null,
      due_date: dueDate || null,
      status: 'todo',
    });

    const row = await db('tasks').where({ id }).first();
    res.status(201).json(row);
  } catch (err) {
    console.error('POST /tasks error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/tasks/:id/status', verifyToken, requirePermission('projects', 'update'), async (req, res) => {
  try {
    const { status } = req.body;
    const existing = await db('tasks').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    await db('tasks').where({ id: req.params.id }).update({ status, updated_at: db.fn.now() });
    await logStatusChange({
      companyId: req.companyId,
      refType: 'task',
      refId: req.params.id,
      fromStatus: existing.status,
      toStatus: status,
      userId: req.user.id,
    });

    const row = await db('tasks').where({ id: req.params.id }).first();
    res.json(row);
  } catch (err) {
    console.error('PUT /tasks/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

export default router;
