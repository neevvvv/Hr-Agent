import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ticketApi } from '../api/tickets';
import NotificationBell from '../components/NotificationBell';

const statusOptions = ['open', 'in_progress', 'resolved', 'closed'];
const statusStyle = {
  open:        'bg-amber-100 text-amber-800',
  in_progress: 'bg-sky-100 text-sky-800',
  resolved:    'bg-emerald-100 text-emerald-800',
  closed:      'bg-slate-100 text-slate-700',
};
const catIcon = { PAYROLL: '💰', IT: '💻', BENEFITS: '🏥', POLICY: '📋', GENERAL: '💬' };

export default function TicketDetail() {
  const { id } = useParams();
  const { auth, logout } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await ticketApi.get(auth.token, id);
      setData(r);
    } catch (e) {
      toast.error(e.message);
      if (e.message.includes('Forbidden') || e.message.includes('Not found')) {
        nav('/tickets');
      }
    }
  }, [auth.token, id, nav]);

  useEffect(() => { refresh(); }, [refresh]);

  async function send() {
    if (!reply.trim() || busy) return;
    setBusy(true);
    try {
      await ticketApi.reply(auth.token, id, reply.trim());
      setReply('');
      await refresh();
    } catch (e) {
      toast.error(e.message);
    } finally { setBusy(false); }
  }

  async function changeStatus(newStatus) {
    setBusy(true);
    try {
      await ticketApi.setStatus(auth.token, id, newStatus);
      toast.success(`Marked ${newStatus.replace('_',' ')}`);
      await refresh();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  if (!data) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>;

  const isAdmin = auth.user.role === 'admin';
  const { ticket, messages } = data;

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <button onClick={() => nav(isAdmin ? '/admin' : '/tickets')} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4"/> Back
          </button>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800 px-3 py-2">Logout</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-start gap-3">
            <div className="text-3xl">{catIcon[ticket.category]}</div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">{ticket.subject}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                <span className="text-slate-500">#{ticket.id}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{ticket.category}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{ticket.employee_name}</span>
                <span className={`px-2 py-0.5 rounded font-semibold ${statusStyle[ticket.status]}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
                {ticket.ai_drafted && (
                  <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-800 font-semibold">🤖 AI-drafted</span>
                )}
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-slate-500">Set status:</span>
              {statusOptions.filter(s => s !== ticket.status).map(s => (
                <button key={s} disabled={busy} onClick={() => changeStatus(s)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded px-2.5 py-1 text-xs">
                  {s.replace('_',' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {messages.map(m => {
            const me = m.author_user_id === auth.user.id;
            return (
              <div key={m.id} className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  me ? 'bg-violet-600 text-white'
                     : m.author_role === 'admin' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-800'
                }`}>
                  <div className="text-[10px] uppercase tracking-wider opacity-70 mb-0.5">
                    {m.author_role === 'admin' ? 'HR' : (me ? 'You' : 'Employee')} · {new Date(m.created_at).toLocaleString()}
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{m.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        {ticket.status !== 'closed' && (
          <div className="bg-white rounded-2xl shadow p-4 flex gap-2">
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              rows={2}
              placeholder={isAdmin ? "Reply as HR…" : "Type your reply…"}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button onClick={send} disabled={busy || !reply.trim()} className="bg-violet-600 text-white rounded-lg px-4 self-end py-2.5 text-sm font-medium hover:bg-violet-700 disabled:opacity-50 flex items-center gap-1">
              <Send className="w-4 h-4"/> Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}