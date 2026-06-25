import db from '../db/connection.js';

export async function notify(userId, { kind, title, body = null, link = null }) {
  if (!userId) return null;
  const res = await db.query(
    `INSERT INTO notifications (user_id, kind, title, body, link)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [userId, kind, title, body, link]
  );
  return res.rows[0].id;
}

export async function notifyAdmins(payload) {
  const admins = await db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
  const ids = [];
  for (const a of admins) {
    const id = await notify(a.id, payload);
    if (id) ids.push(id);
  }
  return ids;
}