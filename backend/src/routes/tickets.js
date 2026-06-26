import { Router } from 'express';
import { z } from 'zod';
import db from '../db/connection.js';
import { authJwt, requireRole } from '../middleware/authJwt.js';
import { logAudit } from '../services/audit.js';
import { notify, notifyAdmins } from '../services/notifications.js';

const router = Router();

const CATEGORIES = ['PAYROLL', 'IT', 'BENEFITS', 'POLICY', 'GENERAL'];

const createSchema = z.object({
  category: z.enum(CATEGORIES),
  subject: z.string().min(3).max(200),
  body: z.string().min(3).max(2000),
  ai_drafted: z.boolean().optional(),
});

const replySchema = z.object({
  body: z.string().min(1).max(2000),
});

const statusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
});

// =====================================
// EMPLOYEE — list my tickets
// =====================================
router.get('/mine', authJwt, async (req, res) => {
  const rows = await db.prepare(`
    SELECT t.id, t.category, t.subject, t.status, t.ai_drafted,
           t.last_activity_at, t.created_at,
           (SELECT COUNT(*) FROM ticket_messages tm WHERE tm.ticket_id = t.id) AS message_count
    FROM tickets t
    WHERE t.employee_id = ?
    ORDER BY t.last_activity_at DESC
  `).all(req.user.eid);
  res.json({ tickets: rows });
});

// =====================================
// EMPLOYEE — single ticket with messages
// =====================================
router.get('/:id', authJwt, async (req, res) => {
  const id = Number(req.params.id);
  const isAdmin = req.user.role === 'admin';

  const ticket = await db.prepare(`
    SELECT t.id, t.category, t.subject, t.status, t.ai_drafted,
           t.last_activity_at, t.created_at,
           e.full_name AS employee_name, e.id AS employee_id
    FROM tickets t
    JOIN employees e ON e.id = t.employee_id
    WHERE t.id = ?
  `).get(id);

  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  // Authorization: employees can only view their own
  if (!isAdmin && ticket.employee_id !== req.user.eid) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const messages = await db.prepare(`
    SELECT id, author_user_id, author_role, body, created_at
    FROM ticket_messages
    WHERE ticket_id = ?
    ORDER BY created_at ASC
  `).all(id);

  res.json({ ticket, messages });
});

// =====================================
// EMPLOYEE — create new ticket (with first message)
// =====================================
router.post('/', authJwt, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const { category, subject, body, ai_drafted } = parsed.data;

  // Insert ticket
  const t = await db.query(`
    INSERT INTO tickets (employee_id, category, subject, ai_drafted)
    VALUES ($1, $2, $3, $4) RETURNING id
  `, [req.user.eid, category, subject, ai_drafted ? true : false]);
  const ticketId = t.rows[0].id;

  // First message (the body)
  await db.query(`
    INSERT INTO ticket_messages (ticket_id, author_user_id, author_role, body)
    VALUES ($1, $2, $3, $4)
  `, [ticketId, req.user.uid, 'employee', body]);

  await logAudit({
    actorUserId: req.user.uid,
    entityType: 'ticket',
    entityId: ticketId,
    action: 'create',
    newValue: `[${category}] ${subject}`,
    aiAssisted: !!ai_drafted,
  });

  // Notify admins
  try {
    await notifyAdmins({
      kind: 'new_ticket',
      title: `${req.user.name} opened a ${category} ticket`,
      body: subject,
      link: `/tickets/${ticketId}`,
    });
  } catch (e) { console.error('notifyAdmins failed:', e.message); }

  res.status(201).json({ id: ticketId, status: 'open' });
});

// =====================================
// REPLY to a ticket (employee OR admin)
// =====================================
router.post('/:id/reply', authJwt, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = replySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const ticket = await db.prepare(`
    SELECT id, employee_id, status FROM tickets WHERE id = ?
  `).get(id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && ticket.employee_id !== req.user.eid) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Insert message
  await db.query(`
    INSERT INTO ticket_messages (ticket_id, author_user_id, author_role, body)
    VALUES ($1, $2, $3, $4)
  `, [id, req.user.uid, isAdmin ? 'admin' : 'employee', parsed.data.body]);

  // Bump last_activity_at + auto-move "open" to "in_progress" if admin replies
  const newStatus = (isAdmin && ticket.status === 'open') ? 'in_progress' : ticket.status;
  await db.query(`
    UPDATE tickets SET last_activity_at = NOW(), status = $1 WHERE id = $2
  `, [newStatus, id]);

  // Notify the OTHER party
  try {
    if (isAdmin) {
      // Notify the employee
      const emp = await db.prepare(`SELECT user_id FROM employees WHERE id = ?`).get(ticket.employee_id);
      if (emp) {
        await notify(emp.user_id, {
          kind: 'ticket_reply',
          title: `HR replied to your ticket #${id}`,
          body: parsed.data.body.slice(0, 100) + (parsed.data.body.length > 100 ? '…' : ''),
          link: `/tickets/${id}`,
        });
      }
    } else {
      // Notify admins
      await notifyAdmins({
        kind: 'ticket_reply',
        title: `${req.user.name} replied to ticket #${id}`,
        body: parsed.data.body.slice(0, 100) + (parsed.data.body.length > 100 ? '…' : ''),
        link: `/tickets/${id}`,
      });
    }
  } catch (e) { console.error('notify failed:', e.message); }

  res.status(201).json({ ok: true });
});

// =====================================
// ADMIN — change status
// =====================================
router.patch('/:id/status', authJwt, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid status' });

  const ticket = await db.prepare(`SELECT employee_id FROM tickets WHERE id = ?`).get(id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  await db.query(`
    UPDATE tickets SET status = $1, last_activity_at = NOW() WHERE id = $2
  `, [parsed.data.status, id]);

  await logAudit({
    actorUserId: req.user.uid,
    entityType: 'ticket',
    entityId: id,
    action: 'status_change',
    newValue: parsed.data.status,
  });

  // Notify the employee
  try {
    const emp = await db.prepare(`SELECT user_id FROM employees WHERE id = ?`).get(ticket.employee_id);
    if (emp) {
      await notify(emp.user_id, {
        kind: 'ticket_status',
        title: `Ticket #${id} marked as ${parsed.data.status.replace('_', ' ')}`,
        link: `/tickets/${id}`,
      });
    }
  } catch (e) { console.error('notify failed:', e.message); }

  res.json({ id, status: parsed.data.status });
});

// =====================================
// ADMIN — list all tickets (with filter)
// =====================================
// =====================================
// ADMIN — list all active (open + in_progress) tickets, marked with who-spoke-last
// =====================================
router.get('/admin/all', authJwt, requireRole('admin'), async (req, res) => {
  const status = req.query.status;
  const validStatuses = ['open', 'in_progress', 'resolved', 'closed', 'active'];
  const filter = validStatuses.includes(status) ? status : 'active';

  let rows;
  if (filter === 'active') {
    // Active = open + in_progress (what HR needs to see day-to-day)
    rows = await db.prepare(`
      SELECT t.id, t.category, t.subject, t.status, t.ai_drafted,
             t.last_activity_at, t.created_at,
             e.full_name AS employee_name,
             (SELECT COUNT(*) FROM ticket_messages tm WHERE tm.ticket_id = t.id) AS message_count,
             (SELECT author_role FROM ticket_messages tm
              WHERE tm.ticket_id = t.id
              ORDER BY tm.created_at DESC LIMIT 1) AS last_author
      FROM tickets t
      JOIN employees e ON e.id = t.employee_id
      WHERE t.status IN ('open', 'in_progress')
      ORDER BY t.last_activity_at DESC
    `).all();
  } else {
    rows = await db.prepare(`
      SELECT t.id, t.category, t.subject, t.status, t.ai_drafted,
             t.last_activity_at, t.created_at,
             e.full_name AS employee_name,
             (SELECT COUNT(*) FROM ticket_messages tm WHERE tm.ticket_id = t.id) AS message_count,
             (SELECT author_role FROM ticket_messages tm
              WHERE tm.ticket_id = t.id
              ORDER BY tm.created_at DESC LIMIT 1) AS last_author
      FROM tickets t
      JOIN employees e ON e.id = t.employee_id
      WHERE t.status = ?
      ORDER BY t.last_activity_at DESC
    `).all(filter);
  }

  res.json({ tickets: rows });
});

export default router;