import { Router } from 'express';
import db from '../db/connection.js';
import { authJwt } from '../middleware/authJwt.js';

const router = Router();

router.get('/', authJwt, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const rows = await db.prepare(`
    SELECT id, kind, title, body, link, read_at, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ${limit}
  `).all(req.user.uid);

  const unread = await db.prepare(
    'SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL'
  ).get(req.user.uid);

  res.json({
    notifications: rows,
    unread_count: Number(unread?.n ?? 0),
  });
});

router.post('/mark-read', authJwt, async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number) : null;
  if (ids && ids.length > 0) {
    await db.query(
      `UPDATE notifications SET read_at = NOW()
       WHERE user_id = $1 AND id = ANY($2::int[]) AND read_at IS NULL`,
      [req.user.uid, ids]
    );
  } else {
    await db.query(
      'UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL',
      [req.user.uid]
    );
  }
  res.json({ ok: true });
});

export default router;