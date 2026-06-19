import { Router } from 'express';
import { z } from 'zod';
import db from '../db/connection.js';
import { authJwt, requireRole } from '../middleware/authJwt.js';

const router = Router();

// =====================================
// EMPLOYEE — leave balance
// =====================================
router.get('/balance', authJwt, async (req, res) => {
  const year = new Date().getFullYear();
  const rows = await db.prepare(`
    SELECT lt.code, lt.name, lt.annual_quota, COALESCE(lb.used_days,0) AS used_days,
           (lt.annual_quota - COALESCE(lb.used_days,0)) AS remaining
    FROM leave_types lt
    LEFT JOIN leave_balances lb
      ON lb.leave_type_id = lt.id
     AND lb.employee_id = ?
     AND lb.year = ?
    ORDER BY lt.id
  `).all(req.user.eid, year);
  res.json({ year, balances: rows });
});

// =====================================
// EMPLOYEE — my requests
// =====================================
router.get('/mine', authJwt, async (req, res) => {
  const rows = await db.prepare(`
    SELECT lr.id, lt.code AS leave_type, lr.start_date, lr.end_date,
           lr.days, lr.reason, lr.status, lr.ai_drafted, lr.created_at
    FROM leave_requests lr
    JOIN leave_types lt ON lt.id = lr.leave_type_id
    WHERE lr.employee_id = ?
    ORDER BY lr.created_at DESC
  `).all(req.user.eid);
  res.json({ requests: rows });
});

// =====================================
// EMPLOYEE — submit new request
// =====================================
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
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) days++;
  }
  return days;
}

router.post('/', authJwt, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });

  const { leave_type, start_date, end_date, reason, ai_drafted } = parsed.data;
  const days = businessDaysBetween(start_date, end_date);
  if (days <= 0) return res.status(400).json({ error: 'end_date must be on or after start_date' });

  const type = await db.prepare('SELECT id, annual_quota FROM leave_types WHERE code = ?').get(leave_type);
  if (!type) return res.status(400).json({ error: 'Unknown leave type' });

  const year = new Date(start_date).getFullYear();
  const bal = await db.prepare(`
    SELECT used_days FROM leave_balances
    WHERE employee_id = ? AND leave_type_id = ? AND year = ?
  `).get(req.user.eid, type.id, year);
  const used = Number(bal?.used_days ?? 0);
  const remaining = type.annual_quota - used;
  if (days > remaining) {
    return res.status(400).json({ error: `Not enough balance. Requested ${days}, remaining ${remaining}.` });
  }

  const result = await db.query(
    `INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, days, reason, ai_drafted)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [req.user.eid, type.id, start_date, end_date, days, reason ?? null, ai_drafted ? true : false]
  );

  res.status(201).json({ id: result.rows[0].id, days, status: 'pending' });
});

// =====================================
// ADMIN — pending queue
// =====================================
router.get('/pending', authJwt, requireRole('admin'), async (_req, res) => {
  const rows = await db.prepare(`
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

// =====================================
// ADMIN — approve / reject (transactional)
// =====================================
const decideSchema = z.object({ decision: z.enum(['approved', 'rejected']) });

router.patch('/:id', authJwt, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = decideSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid decision' });

  const reqRow = await db.prepare(
    "SELECT * FROM leave_requests WHERE id = ? AND status = 'pending'"
  ).get(id);
  if (!reqRow) return res.status(404).json({ error: 'Pending request not found' });

  try {
    await db.transaction(async (client) => {
      await client.query(
        `UPDATE leave_requests SET status = $1, decided_by = $2, decided_at = NOW() WHERE id = $3`,
        [parsed.data.decision, req.user.uid, id]
      );
      if (parsed.data.decision === 'approved') {
        const year = new Date(reqRow.start_date).getFullYear();
        await client.query(
          `INSERT INTO leave_balances (employee_id, leave_type_id, year, used_days)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (employee_id, leave_type_id, year)
           DO UPDATE SET used_days = leave_balances.used_days + EXCLUDED.used_days`,
          [reqRow.employee_id, reqRow.leave_type_id, year, reqRow.days]
        );
      }
    });
    res.json({ id, decision: parsed.data.decision });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;