import { Router } from 'express';
import { z } from 'zod';
import db from '../db/connection.js';
import { authJwt } from '../middleware/authJwt.js';
import { buildPlan } from '../agent/planner.js';
import { toolsByName } from '../agent/tools.js';

const router = Router();

const schema = z.object({ message: z.string().min(1).max(1000) });

router.post('/stream', authJwt, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (event, payload) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  try {
    send('status', { phase: 'planning', message: 'Thinking through your request…' });

    const plan = await buildPlan({ message: parsed.data.message, user: req.user });

    if (!plan || plan.length === 0) {
      send('done', { reply: "I couldn't form a plan for that — could you rephrase?", tool_results: [] });
      return res.end();
    }

    send('plan', { plan });

    const tool_results = [];
    let lastDraft = null;

    for (let i = 0; i < plan.length; i++) {
      const step = plan[i];
      send('step_start', { index: i, step });

      // small delay so UI animates nicely
      await sleep(200);

      const tool = toolsByName[step.action];
      if (!tool) {
        send('step_done', { index: i, ok: false, error: `Unknown tool: ${step.action}` });
        continue;
      }

      try {
        const result = await tool.execute(step.args || {}, { user: req.user });
        tool_results.push({ name: step.action, result });
        if (result?.kind === 'draft' || result?.kind === 'profile_draft' ||
            result?.kind === 'document_draft' || result?.kind === 'ticket_draft') {
          lastDraft = { name: step.action, result };
        }
        send('step_done', { index: i, ok: true, summary: summarize(step.action, result) });
      } catch (e) {
        send('step_done', { index: i, ok: false, error: e.message });
      }
    }

    // Persist for audit
    try {
      await db.query(
        `INSERT INTO agent_plans (user_id, request, plan_json, steps_json, outcome) VALUES ($1,$2,$3,$4,$5)`,
        [req.user.uid, parsed.data.message, JSON.stringify(plan), JSON.stringify(tool_results), lastDraft ? 'draft_ready' : 'completed']
      );
    } catch (e) { /* ignore if table missing */ }

    const reply = composeReply(plan, tool_results, lastDraft);
    send('done', { reply, tool_results, draft: lastDraft?.result || null });
    res.end();
  } catch (e) {
    console.error('plan stream error:', e);
    send('error', { error: e.message });
    res.end();
  }
});

function summarize(action, result) {
  if (!result) return 'no result';
  if (result.error) return result.error;
  if (action === 'getLeaveBalance' && result.balances) {
    const annual = result.balances.find(b => b.code === 'ANNUAL');
    return annual ? `Annual: ${annual.remaining} days remaining` : 'balance fetched';
  }
  if (action === 'getLeavePolicy') return 'policy retrieved';
  if (action === 'listMyRequests') return `${result.count ?? 0} request(s) found`;
  if (action === 'getMyProfile') return `profile loaded`;
  if (action === 'listMyDocuments') return `${result.count ?? 0} document(s)`;
  if (action === 'listMyTickets') return `${result.count ?? 0} ticket(s)`;
  if (action === 'getTicketsAwaitingMyReply') return `${result.count ?? 0} ticket(s) need your reply`;
  if (action === 'getMyNotifications') return `${result.count ?? 0} notification(s)`;
  if (result.kind === 'draft') return `Drafted ${result.days}-day ${result.leave_type} leave`;
  if (result.kind === 'document_draft') return `Drafted ${result.doc_type_label}`;
  if (result.kind === 'profile_draft') return `Drafted ${result.field} update`;
  if (result.kind === 'ticket_draft') return `Drafted ${result.category} ticket`;
  return 'done';
}

function composeReply(plan, results, lastDraft) {
  const lines = [`I went through ${plan.length} step${plan.length > 1 ? 's' : ''} to answer that.`];
  if (lastDraft) {
    lines.push('A draft is ready for you to review and confirm below.');
  } else {
    // Surface the most useful result
    const balance = results.find(r => r.name === 'getLeaveBalance');
    if (balance) {
      const lines2 = balance.result.balances.map(b => `${b.name}: ${b.remaining} of ${b.annual_quota}`).join(' · ');
      lines.push(lines2);
    }
    const policy = results.find(r => r.name === 'getLeavePolicy');
    if (policy) lines.push('Policy summary added.');
    const notifs = results.find(r => r.name === 'getMyNotifications');
    if (notifs) lines.push(`You have ${notifs.result.count} recent notification${notifs.result.count !== 1 ? 's' : ''}.`);
  }
  return lines.join('\n');
}

export default router;