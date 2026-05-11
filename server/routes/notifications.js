import { Router } from 'express';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const rows = await db('notifications')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'desc')
      .limit(20);

    res.json(rows.map(n => ({
      id: String(n.id),
      title: n.title,
      body: n.body,
      type: n.type,
      link: n.link,
      isRead: Boolean(n.is_read),
      createdAt: n.created_at,
    })));
  } catch (err) {
    console.error('GET /notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const [row] = await db('notifications').where({ user_id: req.user.id, is_read: false }).count('* as count');
    res.json({ count: Number(row.count) });
  } catch (err) {
    console.error('GET /notifications/unread-count error:', err);
    res.status(500).json({ error: 'Failed to count notifications' });
  }
});

router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    await db('notifications').where({ id: req.params.id, user_id: req.user.id }).update({ is_read: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('PUT /notifications/:id/read error:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

router.put('/read-all', verifyToken, async (req, res) => {
  try {
    await db('notifications').where({ user_id: req.user.id, is_read: false }).update({ is_read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('PUT /notifications/read-all error:', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

export default router;
