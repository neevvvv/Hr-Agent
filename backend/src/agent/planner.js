import OpenAI from 'openai';
import { toolsByName } from './tools.js';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});
const MODEL = process.env.OPENAI_MODEL || 'llama-3.3-70b-versatile';

const PLANNER_SYSTEM = `
You are a planning agent for an HR platform. The user gives you a goal. Produce a step-by-step JSON plan.

Format: { "plan": [ {"step":1, "action":"<toolName>", "args":<object>, "reason":"<short>" }, ... ] }

Available tools:
${Object.values(toolsByName).map(t => {
  const params = t.parameters?.properties ? Object.entries(t.parameters.properties)
    .map(([k, v]) => `${k}${t.parameters.required?.includes(k) ? '*' : ''}: ${v.type}${v.enum ? ` (${v.enum.join('|')})` : ''}`)
    .join(', ') : '(no args)';
  return `- ${t.name}: ${t.description}\n  args: ${params}`;
}).join('\n')}

CRITICAL rules for args:
- For draftLeaveRequest you MUST provide leave_type (ANNUAL|SICK|CASUAL), start_date and end_date as YYYY-MM-DD strings.
- For draftDocumentRequest you MUST provide doc_type and purpose.
- For draftTicket you MUST provide category, subject and body.
- For draftProfileUpdate you MUST provide field and value.
- Output ONLY a JSON object with a "plan" array. No prose. No markdown fences.
- Steps run sequentially; you cannot reference previous results dynamically so put real values in each step's args.
- If you need to default dates around an Indian holiday: Diwali 2026 = Oct 22 (Thu). Holi 2026 = Mar 5. Christmas = Dec 25.
- For "plan time off around X" requests, choose ANNUAL leave and a 3-5 business-day window around the holiday.
- Use YYYY-MM-DD dates. Today is ${new Date().toISOString().slice(0,10)}.
- For simple lookups, 1 step is enough. For complex planning, 2-5 steps.
- If you can't help, return { "plan": [] }.

Examples:

User goal: "plan my Diwali week off"
Output:
{
  "plan": [
    {"step":1, "action":"getLeaveBalance", "args":{}, "reason":"Check available leave balance"},
    {"step":2, "action":"draftLeaveRequest", "args":{"leave_type":"ANNUAL","start_date":"2026-10-19","end_date":"2026-10-23","reason":"Diwali week off"}, "reason":"Draft 5-day leave around Diwali"}
  ]
}

User goal: "give me an overview of my account"
Output:
{
  "plan": [
    {"step":1, "action":"getLeaveBalance", "args":{}, "reason":"Check balance"},
    {"step":2, "action":"listMyRequests", "args":{}, "reason":"List pending requests"},
    {"step":3, "action":"getMyNotifications", "args":{}, "reason":"Check notifications"}
  ]
}
`.trim();

export async function buildPlan({ message, user }) {
  const userMsg = `User (${user.name}, ${user.role}, employee_id=${user.eid}) goal: ${message}`;
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: PLANNER_SYSTEM },
      { role: 'user', content: userMsg },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },   // Groq Llama supports this
  });
  const raw = completion.choices[0].message.content || '{}';
  try {
    const parsed = JSON.parse(raw);
    // Llama may wrap in { plan: [...] } or { steps: [...] }, normalize
    const arr = Array.isArray(parsed) ? parsed
              : Array.isArray(parsed.plan) ? parsed.plan
              : Array.isArray(parsed.steps) ? parsed.steps
              : [];
    return arr;
  } catch (e) {
    console.error('Plan parse failed:', e.message, raw);
    return [];
  }
}