import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { agentApi } from '../api/agent';
import { leaveApi } from '../api/leave';
import { profileApi } from '../api/profile';

export default function ChatBox({ onLeaveCreated }) {
  const { auth } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I can check your leave balance, look up policy, list your requests, draft a leave request, view your profile, or help update profile fields. What do you need?",
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, draft, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: text }]);
    setBusy(true);
    try {
      const history = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));
      const res = await agentApi.chat(auth.token, text, history);

      // Leave draft
      const leaveDraft = res.tool_results?.find(t => t.name === 'draftLeaveRequest');
      if (leaveDraft?.result?.kind === 'draft') {
        setDraft(leaveDraft.result);
      }

      // Profile draft
      const profileDraft = res.tool_results?.find(t => t.name === 'draftProfileUpdate');
      if (profileDraft?.result?.kind === 'profile_draft') {
        setDraft({ ...profileDraft.result, kind: 'profile_draft' });
      }

      setMessages(m => [...m, { role: 'assistant', content: res.reply || '(no reply)' }]);
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: `❌ ${e.message}` }]);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDraft() {
    if (!draft) return;
    setBusy(true);
    try {
      if (draft.kind === 'profile_draft') {
        await profileApi.update(auth.token, draft.field, draft.new_value, true);
        setMessages(m => [...m, {
          role: 'assistant',
          content: `✅ Updated ${draft.field.replace(/_/g, ' ')}. The change is saved.`,
        }]);
      } else {
        const r = await leaveApi.create(auth.token, {
          leave_type: draft.leave_type,
          start_date: draft.start_date,
          end_date: draft.end_date,
          reason: draft.reason,
          ai_drafted: true,
        });
        setMessages(m => [...m, {
          role: 'assistant',
          content: `✅ Submitted request #${r.id} (${r.days} day${r.days > 1 ? 's' : ''}). It's now pending HR approval.`,
        }]);
      }
      setDraft(null);
      onLeaveCreated?.();
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: `❌ Couldn't save: ${e.message}` }]);
    } finally {
      setBusy(false);
    }
  }

  function cancelDraft() {
    setDraft(null);
    setMessages(m => [...m, { role: 'assistant', content: 'Cancelled. Anything else?' }]);
  }

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-violet-600 text-white text-2xl shadow-lg hover:bg-violet-700 z-50"
        aria-label="Open HR assistant"
      >
        {open ? '×' : '🤖'}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 w-[380px] max-w-[calc(100vw-3rem)] h-[560px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border">
          <div className="px-4 py-3 border-b bg-violet-600 text-white rounded-t-2xl">
            <p className="font-semibold">HR Assistant</p>
            <p className="text-xs opacity-80">Powered by Llama 3.3 · Groq</p>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === 'user' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-800'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}

            {/* ============ PROFILE DRAFT CARD ============ */}
            {draft && draft.kind === 'profile_draft' && (
              <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-3 my-2">
                <p className="text-xs uppercase tracking-wider text-indigo-700 font-semibold">
                  ✏️ Profile update — awaiting your confirmation
                </p>
                <div className="mt-2 text-sm space-y-1 text-slate-700">
                  <p><strong>Field:</strong> {draft.field.replace(/_/g, ' ')}</p>
                  <p>
                    <strong>Old:</strong>{' '}
                    <span className="text-slate-500">{draft.old_value || '∅'}</span>
                  </p>
                  <p>
                    <strong>New:</strong>{' '}
                    <span className="text-indigo-700 font-semibold">{draft.new_value}</span>
                  </p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    disabled={busy}
                    onClick={confirmDraft}
                    className="bg-emerald-600 text-white text-sm rounded-lg px-3 py-1.5 font-medium hover:bg-emerald-700 disabled:opacity-50"
                  >
                    ✅ Confirm
                  </button>
                  <button
                    disabled={busy}
                    onClick={cancelDraft}
                    className="bg-slate-200 text-slate-700 text-sm rounded-lg px-3 py-1.5 font-medium hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ============ LEAVE DRAFT CARD ============ */}
            {draft && draft.kind !== 'profile_draft' && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 my-2">
                <p className="text-xs uppercase tracking-wider text-amber-700 font-semibold">
                  📋 Draft — awaiting your confirmation
                </p>
                <div className="mt-2 text-sm space-y-1 text-slate-700">
                  <p><strong>Type:</strong> {draft.leave_type}</p>
                  <p><strong>Dates:</strong> {draft.start_date} → {draft.end_date}</p>
                  <p>
                    <strong>Days:</strong> {draft.days} business day{draft.days > 1 ? 's' : ''}
                  </p>
                  {draft.reason && <p><strong>Reason:</strong> {draft.reason}</p>}
                  <p className="text-xs text-slate-500">
                    Current {draft.leave_type.toLowerCase()} balance: {draft.remaining_balance} days
                  </p>
                  {draft.warning && (
                    <p className="text-rose-700 font-medium bg-rose-50 rounded p-2 mt-2">
                      ⚠️ {draft.warning}
                    </p>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    disabled={busy || !!draft.warning}
                    onClick={confirmDraft}
                    className="bg-emerald-600 text-white text-sm rounded-lg px-3 py-1.5 font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={draft.warning ? 'Cannot submit — insufficient balance' : ''}
                  >
                    ✅ Confirm & Submit
                  </button>
                  <button
                    disabled={busy}
                    onClick={cancelDraft}
                    className="bg-slate-200 text-slate-700 text-sm rounded-lg px-3 py-1.5 font-medium hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {busy && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl px-3 py-2 text-sm text-slate-500 animate-pulse">
                  …thinking
                </div>
              </div>
            )}
          </div>

          <div className="border-t p-2 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about leave or profile…"
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              disabled={busy}
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              className="bg-violet-600 text-white rounded-lg px-4 text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}