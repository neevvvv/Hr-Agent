import db from '../db/connection.js';

export const tools = [
  {
    name: 'getLeaveBalance',
    description: "Get the current user's leave balance for the current year (Annual / Sick / Casual).",
    parameters: { type: 'object', properties: {}, required: [] },
    execute: async (_args, ctx) => {
      const year = new Date().getFullYear();
      const rows = await db.prepare(`
        SELECT lt.code, lt.name, lt.annual_quota,
               COALESCE(lb.used_days,0) AS used_days,
               (lt.annual_quota - COALESCE(lb.used_days,0)) AS remaining
        FROM leave_types lt
        LEFT JOIN leave_balances lb
          ON lb.leave_type_id = lt.id AND lb.employee_id = ? AND lb.year = ?
        ORDER BY lt.id
      `).all(ctx.user.eid, year);
      return { year, balances: rows };
    },
  },

  {
    name: 'getLeavePolicy',
    description: 'Return the company leave policy: types, day quotas, approval flow.',
    parameters: { type: 'object', properties: {}, required: [] },
    execute: async () => ({
      source: 'XYZCorp HR Policy 2026',
      types: [
        { code: 'ANNUAL', name: 'Annual Leave', quota_days: 20 },
        { code: 'SICK',   name: 'Sick Leave',   quota_days: 10 },
        { code: 'CASUAL', name: 'Casual Leave', quota_days:  5 },
      ],
      approval_flow: 'Submit → Reporting Manager approval → HR escalation if delayed',
      notes: 'Weekends excluded from leave-day count. Unused leave does not carry over.',
    }),
  },

  {
    name: 'listMyRequests',
    description: "List the current user's leave requests, most recent first.",
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'all'], description: 'Filter by status. Default all.' },
      },
      required: [],
    },
    execute: async (args, ctx) => {
      const status = args?.status ?? 'all';
      const base = `
        SELECT lr.id, lt.code AS leave_type, lr.start_date, lr.end_date,
               lr.days, lr.reason, lr.status, lr.created_at
        FROM leave_requests lr
        JOIN leave_types lt ON lt.id = lr.leave_type_id
        WHERE lr.employee_id = ?`;
      const rows = status === 'all'
        ? await db.prepare(base + ' ORDER BY lr.created_at DESC').all(ctx.user.eid)
        : await db.prepare(base + ' AND lr.status = ? ORDER BY lr.created_at DESC').all(ctx.user.eid, status);
      return { count: rows.length, requests: rows };
    },
  },

  {
    name: 'draftLeaveRequest',
    description:
      'Draft a leave request for the user to review. Does NOT save anything. The user must explicitly click Confirm before it is submitted.',
    parameters: {
      type: 'object',
      properties: {
        leave_type: { type: 'string', enum: ['ANNUAL', 'SICK', 'CASUAL'] },
        start_date: { type: 'string', description: 'YYYY-MM-DD' },
        end_date:   { type: 'string', description: 'YYYY-MM-DD' },
        reason:     { type: 'string', description: 'Brief reason' },
      },
      required: ['leave_type', 'start_date', 'end_date'],
    },
    execute: async (args, ctx) => {
      const start = new Date(args.start_date + 'T00:00:00Z');
      const end   = new Date(args.end_date   + 'T00:00:00Z');
      let days = 0;
      for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        const dow = d.getUTCDay();
        if (dow !== 0 && dow !== 6) days++;
      }
      const year = start.getUTCFullYear();
      const t = await db.prepare('SELECT id, annual_quota FROM leave_types WHERE code = ?').get(args.leave_type);
      const bal = await db.prepare(`
        SELECT COALESCE(used_days,0) AS used FROM leave_balances
        WHERE employee_id=? AND leave_type_id=? AND year=?
      `).get(ctx.user.eid, t.id, year);
      const used = Number(bal?.used ?? 0);
      const remaining = t.annual_quota - used;
      return {
        kind: 'draft',
        leave_type: args.leave_type,
        start_date: args.start_date,
        end_date: args.end_date,
        days,
        reason: args.reason ?? '',
        remaining_balance: remaining,
        warning: days > remaining ? `Not enough ${args.leave_type} balance (need ${days}, have ${remaining}).` : null,
        requires_confirmation: true,
      };
    },
  },
];

export const toolsByName = Object.fromEntries(tools.map(t => [t.name, t]));

export const toolsForLLM = tools.map(t => ({
  type: 'function',
  function: {
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  },
}));