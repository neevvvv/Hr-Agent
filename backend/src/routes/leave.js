import { Router } from 'express';
import { z } from 'zod';
import db from '../db/connection.js';
import { authJwt, requireRole } from '../middleware/authJwt.js';

const router = Router();

// ============================================
// EMPLOYEE — view my leave balance
// ============================================
router.get('/balance', authJwt, (req, res) => {
  const year = new Date().getFullYear();
  const rows = db.prepare(`
    SELECT lt.code, lt.name, lt.annual_quota, lb.used_days,
           (lt.annual_quota - lb.used_days) AS remaining
    FROM leave_types lt
    LEFT JOIN leave_balances lb
      ON lb.leave_type_id = lt.id
     AND lb.employee_id = ?
     AND lb.year = ?
    ORDER BY lt.id
  `).all(req.user.eid, year);
  res.json({ year, balances: rows });
});

// ============================================
// EMPLOYEE — list my own leave requests
// ============================================
router.get('/mine', authJwt, (req, res) => {
  const rows = db.prepare(`
    SELECT lr.id, lt.code AS leave_type, lr.start_date, lr.end_date,
           lr.days, lr.reason, lr.status, lr.ai_drafted, lr.created_at
    FROM leave_requests lr
    JOIN leave_types lt ON lt.id = lr.leave_type_id
    WHERE lr.employee_id = ?
    ORDER BY lr.created_at DESC
  `).all(req.user.eid);
  res.json({ requests: rows });
});

// ============================================
// EMPLOYEE — submit a new leave request
// ============================================
const createSchema = z.object({
  leave_type: z.enum(['ANNUAL', 'SICK', 'CASUAL']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(500).optional(),
  ai_drafted: z.boolean().optional(),
});

function businessDaysBetween(startStr, endStr) {
  const start = new Date(startStr + 'T00:00:00Z');
  const end = new Date(endStr + 'T00:00:00Z');
  if (end < start) return -1;
  let days = 0;
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dow = d.getUTCDay(); // 0=Sun, 6=Sat
    if (dow !== 0 && dow !== 6) days++;
  }
  return days;
}

router.post('/', authJwt, (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });

  const { leave_type, start_date, end_date, reason, ai_drafted } = parsed.data;
  const days = businessDaysBetween(start_date, end_date);
  if (days <= 0) return res.status(400).json({ error: 'end_date must be on or after start_date' });

  const type = db.prepare('SELECT id, annual_quota FROM leave_types WHERE code = ?').get(leave_type);
  if (!type) return res.status(400).json({ error: 'Unknown leave type' });

  const year = new Date(start_date).getFullYear();
  const bal = db.prepare(`
    SELECT used_days FROM leave_balances
    WHERE employee_id = ? AND leave_type_id = ? AND year = ?
  `).get(req.user.eid, type.id, year);
  const used = bal?.used_days ?? 0;
  const remaining = type.annual_quota - used;
  if (days > remaining) {
    return res.status(400).json({ error: `Not enough balance. Requested ${days}, remaining ${remaining}.` });
  }

  const info = db.prepare(`
    INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, days, reason, ai_drafted)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.eid, type.id, start_date, end_date, days, reason ?? null, ai_drafted ? 1 : 0);

  res.status(201).json({ id: info.lastInsertRowid, days, status: 'pending' });
});

// ============================================
// ADMIN — list all pending requests
// ============================================
router.get('/pending', authJwt, requireRole('admin'), (_req, res) => {
  const rows = db.prepare(`
    SELECT lr.id, e.full_name AS employee, lt.code AS leave_type,
           lr.start_date, lr.end_date, lr.days, lr.reason, lr.ai_drafted, lr.created_at
    FROM leave_requests lr
    JOIN employees e ON e.id = lr.employee_id
    JOIN leave_types lt ON lt.id = lr.leave_type_id
    WHERE lr.status = 'pending'
    ORDER BY lr.created_at ASC
  `).all();
  res.json({ requests: rows });
});

// ============================================
// ADMIN — approve / reject (transactional balance update)
// ============================================
const decideSchema = z.object({ decision: z.enum(['approved', 'rejected']) });

router.patch('/:id', authJwt, requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  const parsed = decideSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid decision' });

  const reqRow = db.prepare(`
    SELECT * FROM leave_requests WHERE id = ? AND status = 'pending'
  `).get(id);
  if (!reqRow) return res.status(404).json({ error: 'Pending request not found' });

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE leave_requests
      SET status = ?, decided_by = ?, decided_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(parsed.data.decision, req.user.uid, id);

    if (parsed.data.decision === 'approved') {
      const year = new Date(reqRow.start_date).getFullYear();
      db.prepare(`
        INSERT INTO leave_balances (employee_id, leave_type_id, year, used_days)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(employee_id, leave_type_id, year)
        DO UPDATE SET used_days = used_days + excluded.used_days
      `).run(reqRow.employee_id, reqRow.leave_type_id, year, reqRow.days);
    }
  });
  tx();
  res.json({ id, decision: parsed.data.decision });
});

export default router;