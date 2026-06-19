import db from '../db/connection.js';

export const tools = [
  {
    name: 'getLeaveBalance',
    description: "Get the current user's leave balance for the current year (Annual / Sick / Casual).",
    parameters: { type: 'object', properties: {}, required: [] },
    execute: (_args, ctx) => {
      const year = new Date().getFullYear();
      const rows = db.prepare(`
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
    description: 'Return the company leave policy: leave types, day quotas, and approval flow.',
    parameters: { type: 'object', properties: {}, required: [] },
    execute: () => ({
      source: 'XYZCorp HR Policy 2026',
      types: [
        { code: 'ANNUAL', name: 'Annual Leave', quota_days: 20 },
        { code: 'SICK',   name: 'Sick Leave',   quota_days: 10 },
        { code: 'CASUAL', name: 'Casual Leave', quota_days:  5 },
      ],
      approval_flow: 'Submit → Reporting Manager approval → HR escalation if delayed',
      notes: 'Weekends are excluded from leave-day count. Unused leave does not carry over to the next year.',
    }),
  },

  {
    name: 'listMyRequests',
    description: "List the current user's own leave requests, most recent first.",
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'approved', 'rejected', 'all'],
          description: 'Filter by status. Defaults to "all".',
        },
      },
      required: [],
    },
    execute: (args, ctx) => {
      const status = args?.status ?? 'all';
      const base = `
        SELECT lr.id, lt.code AS leave_type, lr.start_date, lr.end_date,
               lr.days, lr.reason, lr.status, lr.created_at
        FROM leave_requests lr
        JOIN leave_types lt ON lt.id = lr.leave_type_id
        WHERE lr.employee_id = ?`;
      const rows = status === 'all'
        ? db.prepare(base + ' ORDER BY lr.created_at DESC').all(ctx.user.eid)
        : db.prepare(base + ' AND lr.status = ? ORDER BY lr.created_at DESC').all(ctx.user.eid, status);
      return { count: rows.length, requests: rows };
    },
  },

  {
    name: 'draftLeaveRequest',
    description:
      'Draft a leave request for the user to review. Does NOT save anything. The user must explicitly click Confirm before it is submitted to HR.',
    parameters: {
      type: 'object',
      properties: {
        leave_type: { type: 'string', enum: ['ANNUAL', 'SICK', 'CASUAL'] },
        start_date: { type: 'string', description: 'YYYY-MM-DD format' },
        end_date:   { type: 'string', description: 'YYYY-MM-DD format' },
        reason:     { type: 'string', description: 'Brief reason for the leave' },
      },
      required: ['leave_type', 'start_date', 'end_date'],
    },
    execute: (args, ctx) => {
      const start = new Date(args.start_date + 'T00:00:00Z');
      const end   = new Date(args.end_date   + 'T00:00:00Z');
      let days = 0;
      for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        const dow = d.getUTCDay();
        if (dow !== 0 && dow !== 6) days++;
      }
      const year = start.getUTCFullYear();
      const t = db.prepare('SELECT id, annual_quota FROM leave_types WHERE code = ?').get(args.leave_type);
      const bal = db.prepare(`
        SELECT COALESCE(used_days,0) AS used FROM leave_balances
        WHERE employee_id=? AND leave_type_id=? AND year=?
      `).get(ctx.user.eid, t.id, year);
      const remaining = t.annual_quota - (bal?.used ?? 0);
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

// Format for the OpenAI / Groq function-calling API
export const toolsForLLM = tools.map(t => ({
  type: 'function',
  function: {
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  },
}));