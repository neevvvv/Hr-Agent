import OpenAI from 'openai';
import { toolsByName, toolsForLLM } from './tools.js';
import { systemPrompt } from './systemPrompt.js';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});
const MODEL = process.env.OPENAI_MODEL || 'llama-3.3-70b-versatile';

export async function runAgent({ message, user, history = [] }) {
  const messages = [
    { role: 'system', content: systemPrompt(user) },
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
      return { reply: choice.content ?? '', tool_results: tool_results_for_ui };
    }

    for (const call of choice.tool_calls) {
      const tool = toolsByName[call.function.name];
      let result;
      try {
        const args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
        result = tool
          ? await tool.execute(args, { user })            // ← await is the key change
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