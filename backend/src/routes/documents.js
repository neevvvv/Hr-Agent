import { Router } from 'express';
import { z } from 'zod';
import db from '../db/connection.js';
import { authJwt, requireRole } from '../middleware/authJwt.js';
import { logAudit } from '../services/audit.js';
import { notify, notifyAdmins } from '../services/notifications.js';
import { generateLetterContent, getDocTypeLabel } from '../services/letterGenerator.js';

const router = Router();

const DOC_TYPES = ['EMPLOYMENT_LETTER', 'SALARY_CERTIFICATE', 'EXPERIENCE_LETTER', 'ADDRESS_PROOF', 'NOC'];

const createSchema = z.object({
  doc_type: z.enum(DOC_TYPES),
  purpose: z.string().min(3).max(300),
  ai_drafted: z.boolean().optional(),
});

const decideSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
});

// =====================================
// EMPLOYEE — list my document requests
// =====================================
router.get('/mine', authJwt, async (req, res) => {
  const rows = await db.prepare(`
    SELECT id, doc_type, purpose, status, ai_drafted, created_at, decided_at
    FROM document_requests
    WHERE employee_id = ?
    ORDER BY created_at DESC
  `).all(req.user.eid);
  res.json({ requests: rows });
});

// =====================================
// EMPLOYEE — submit new document request
// =====================================
router.post('/', authJwt, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const { doc_type, purpose, ai_drafted } = parsed.data;

  const result = await db.query(`
    INSERT INTO document_requests (employee_id, doc_type, purpose, ai_drafted)
    VALUES ($1, $2, $3, $4) RETURNING id
  `, [req.user.eid, doc_type, purpose, ai_drafted ? true : false]);

  const requestId = result.rows[0].id;

  // Audit
  await logAudit({
    actorUserId: req.user.uid,
    entityType: 'document_request',
    entityId: requestId,
    action: 'create',
    newValue: `${doc_type} for "${purpose}"`,
    aiAssisted: !!ai_drafted,
  });

  // Notify admins
  try {
    await notifyAdmins({
      kind: 'doc_request',
      title: `${req.user.name} requested a ${getDocTypeLabel(doc_type)}`,
      body: `Purpose: ${purpose}`,
      link: '/admin',
    });
  } catch (e) { console.error('notifyAdmins failed:', e.message); }

  res.status(201).json({ id: requestId, status: 'pending' });
});

// =====================================
// EMPLOYEE — view single document (if approved)
// =====================================
router.get('/:id', authJwt, async (req, res) => {
  const row = await db.prepare(`
    SELECT id, doc_type, purpose, status, generated_content, created_at, decided_at
    FROM document_requests
    WHERE id = ? AND employee_id = ?
  `).get(Number(req.params.id), req.user.eid);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ document: row });
});

// =====================================
// ADMIN — pending document requests
// =====================================
router.get('/admin/pending', authJwt, requireRole('admin'), async (_req, res) => {
  const rows = await db.prepare(`
    SELECT dr.id, e.full_name AS employee, dr.doc_type, dr.purpose,
           dr.ai_drafted, dr.created_at
    FROM document_requests dr
    JOIN employees e ON e.id = dr.employee_id
    WHERE dr.status = 'pending'
    ORDER BY dr.created_at ASC
  `).all();
  res.json({ requests: rows });
});

// =====================================
// ADMIN — approve / reject
// =====================================
router.patch('/:id', authJwt, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = decideSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid decision' });

  const reqRow = await db.prepare(`
    SELECT * FROM document_requests WHERE id = ? AND status = 'pending'
  `).get(id);
  if (!reqRow) return res.status(404).json({ error: 'Pending request not found' });

  // If approved, generate letter content
  let generated_content = null;
  if (parsed.data.decision === 'approved') {
    const employee = await db.prepare(`
      SELECT id, full_name, joined_on FROM employees WHERE id = ?
    `).get(reqRow.employee_id);
    const profile = await db.prepare(`
      SELECT job_title, department, address_line1, city, state, postal_code, country
      FROM worker_profiles WHERE employee_id = ?
    `).get(reqRow.employee_id);
    generated_content = generateLetterContent({
      docType: reqRow.doc_type,
      employee,
      profile,
      purpose: reqRow.purpose,
    });
  }

  await db.query(`
    UPDATE document_requests
    SET status = $1, decided_by = $2, decided_at = NOW(), generated_content = $3
    WHERE id = $4
  `, [parsed.data.decision, req.user.uid, generated_content, id]);

  await logAudit({
    actorUserId: req.user.uid,
    entityType: 'document_request',
    entityId: id,
    action: parsed.data.decision,
  });

  // Notify the employee
  try {
    const emp = await db.prepare(`SELECT user_id FROM employees WHERE id = ?`).get(reqRow.employee_id);
    if (emp) {
      await notify(emp.user_id, {
        kind: parsed.data.decision === 'approved' ? 'doc_approved' : 'doc_rejected',
        title: parsed.data.decision === 'approved'
          ? `📄 Your ${getDocTypeLabel(reqRow.doc_type)} is ready`
          : `❌ Your ${getDocTypeLabel(reqRow.doc_type)} request was rejected`,
        body: parsed.data.decision === 'approved'
          ? `Click to view and download.`
          : `Purpose: ${reqRow.purpose}`,
        link: '/documents',
      });
    }
  } catch (e) { console.error('notify failed:', e.message); }

  res.json({ id, decision: parsed.data.decision });
});

export default router;