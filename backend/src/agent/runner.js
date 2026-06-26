import OpenAI from 'openai';
import { toolsByName, toolsForLLM } from './tools.js';
import { systemPrompt } from './systemPrompt.js';
import { searchMemories, saveMemory } from '../services/memoryStore.js';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});
const MODEL = process.env.OPENAI_MODEL || 'llama-3.3-70b-versatile';

export async function runAgent({ message, user, history = [] }) {
  // === RETRIEVE relevant memories ===
  let memoryContext = '';
  try {
    const memories = await searchMemories({
      userId: user.uid,
      query: message,
      limit: 5,
    });
    if (memories.length > 0) {
      memoryContext = `\n\nRelevant memories about this user:\n` +
        memories.map((m, i) => `- ${m.content}`).join('\n');
    }
  } catch (e) {
    console.error('memory retrieval failed:', e.message);
  }

  const messages = [
    { role: 'system', content: systemPrompt(user) + memoryContext },
    ...history,
    { role: 'user', content: message },
  ];

  const tool_results_for_ui = [];

  for (let round = 0; round < 3; round++) {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages,
      tools: toolsForLLM,
      tool_choice: 'auto',
      temperature: 0.3,
    });

    const choice = completion.choices[0].message;
    messages.push(choice);

    if (!choice.tool_calls || choice.tool_calls.length === 0) {
      // === AUTO-CAPTURE memorable facts (non-blocking) ===
      autoCaptureFromConversation({ user, userMessage: message, assistantReply: choice.content }).catch(e => {
        console.error('auto-capture failed:', e.message);
      });
      return { reply: choice.content ?? '', tool_results: tool_results_for_ui };
    }

    for (const call of choice.tool_calls) {
      const tool = toolsByName[call.function.name];
      let result;
      try {
        const args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
        result = tool
          ? await tool.execute(args, { user })
          : { error: `Unknown tool: ${call.function.name}` };
      } catch (e) {
        result = { error: e.message };
      }
      tool_results_for_ui.push({ name: call.function.name, result });
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  return { reply: "I had trouble completing that — could you rephrase?", tool_results: tool_results_for_ui };
}


/**
 * Background: ask the LLM to extract memorable facts from this exchange.
 * Runs after the user gets their reply — non-blocking.
 */
async function autoCaptureFromConversation({ user, userMessage, assistantReply }) {
  const extractPrompt = `
You are reviewing a conversation between an HR assistant and ${user.name}.
Extract any persistent FACTS about the user that should be remembered (preferences, allergies, family situations, routine, work style).

DO NOT extract:
- Transient things (today's task, current question)
- Things already implied by user role/department
- Numbers like leave balance (these change)

If nothing is worth remembering, output: NONE
Otherwise output one fact per line, phrased in 3rd person.
Max 3 facts.

Conversation:
USER: ${userMessage}
ASSISTANT: ${assistantReply}
`.trim();

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: extractPrompt }],
      temperature: 0,
      max_tokens: 200,
    });
    const raw = completion.choices[0].message.content?.trim() || '';
    if (!raw || raw.toUpperCase().includes('NONE')) return;

    const facts = raw
      .split('\n')
      .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
      .filter(l => l.length > 10 && l.length < 200);

    for (const fact of facts.slice(0, 3)) {
      await saveMemory({ userId: user.uid, content: fact, source: 'auto' });
    }
  } catch (e) {
    console.error('extractor:', e.message);
  }
}