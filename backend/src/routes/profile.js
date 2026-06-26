import { Router } from 'express';
import { z } from 'zod';
import db from '../db/connection.js';
import { authJwt } from '../middleware/authJwt.js';
import { logAudit } from '../services/audit.js';

const router = Router();

// =====================================
// GET /profile — current user's profile
// =====================================
router.get('/', authJwt, async (req, res) => {
  if (!req.user.eid) return res.status(404).json({ error: 'No employee record for this user' });

  const profile = await db.prepare(`
    SELECT e.full_name, e.joined_on, u.email AS account_email, u.role,
           wp.phone, wp.email, wp.address_line1, wp.address_line2, wp.city,
           wp.state, wp.postal_code, wp.country,
           wp.emergency_contact_name, wp.emergency_contact_phone, wp.emergency_contact_relation,
           wp.date_of_birth, wp.blood_group, wp.job_title, wp.department,
           wp.updated_at
    FROM employees e
    JOIN users u ON u.id = e.user_id
    LEFT JOIN worker_profiles wp ON wp.employee_id = e.id
    WHERE e.id = ?
  `).get(req.user.eid);

  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json({ profile });
});

// =====================================
// GET /profile/history — audit log of changes
// =====================================
router.get('/history', authJwt, async (req, res) => {
  const rows = await db.prepare(`
    SELECT id, action, field, old_value, new_value, ai_assisted, created_at
    FROM audit_log
    WHERE entity_type = 'profile' AND entity_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(req.user.eid);
  res.json({ history: rows });
});

// =====================================
// PATCH /profile — update editable fields
// =====================================
const editableFields = [
  'phone', 'email', 'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
  'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation', 'blood_group',
];

const updateSchema = z.object({
  field: z.enum(editableFields),
  value: z.string().max(255).nullable(),
  ai_assisted: z.boolean().optional(),
});

router.patch('/', authJwt, async (req, res) => {
  if (!req.user.eid) return res.status(404).json({ error: 'No employee record' });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid input',
      hint: `Field must be one of: ${editableFields.join(', ')}`,
    });
  }
  const { field, value, ai_assisted } = parsed.data;

  // Read old value for audit
  const old = await db.prepare(
    `SELECT ${field} AS v FROM worker_profiles WHERE employee_id = ?`
  ).get(req.user.eid);
  const oldValue = old?.v ?? null;

  // Upsert
  await db.query(`
    INSERT INTO worker_profiles (employee_id, ${field}, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (employee_id) DO UPDATE SET ${field} = EXCLUDED.${field}, updated_at = NOW()
  `, [req.user.eid, value]);

  // Audit
  await logAudit({
    actorUserId: req.user.uid,
    entityType: 'profile',
    entityId: req.user.eid,
    action: 'update',
    field,
    oldValue,
    newValue: value,
    aiAssisted: !!ai_assisted,
  });

  res.json({ ok: true, field, value });
});

export default router;