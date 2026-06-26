import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Ticket, ArrowLeft, Plus, MessageSquare, Clock, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ticketApi } from '../api/tickets';
import NotificationBell from '../components/NotificationBell';

const CATEGORIES = [
  { code: 'PAYROLL',  label: 'Payroll',  icon: '💰', desc: 'Salary, taxes, payslips' },
  { code: 'IT',       label: 'IT',       icon: '💻', desc: 'Laptop, VPN, accounts' },
  { code: 'BENEFITS', label: 'Benefits', icon: '🏥', desc: 'Insurance, wellness, perks' },
  { code: 'POLICY',   label: 'Policy',   icon: '📋', desc: 'HR rules and procedures' },
  { code: 'GENERAL',  label: 'General',  icon: '💬', desc: 'Anything else' },
];
const catMeta = Object.fromEntries(CATEGORIES.map(c => [c.code, c]));

const statusStyle = {
  open:        { badge: 'bg-amber-100 text-amber-800', label: 'open' },
  in_progress: { badge: 'bg-sky-100 text-sky-800', label: 'in progress' },
  resolved:    { badge: 'bg-emerald-100 text-emerald-800', label: 'resolved' },
  closed:      { badge: 'bg-slate-100 text-slate-700', label: 'closed' },
};

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function NewTicketModal({ open, onClose, onSubmit }) {
  const [category, setCategory] = useState('GENERAL');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setBusy(true);
    try {
      await onSubmit({ category, subject, body });
      setSubject(''); setBody(''); setCategory('GENERAL');
      onClose();
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-slate-900">Open a Ticket</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5"/></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">Category</label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORIES.map(c => (
                <label key={c.code} className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer ${category === c.code ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="cat" value={c.code} checked={category === c.code} onChange={e => setCategory(e.target.value)} />
                  <span className="text-xl">{c.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="text-[11px] text-slate-500">{c.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief title" className="w-full border rounded-lg px-3 py-2 mt-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">Details</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="Describe your issue or question" className="w-full border rounded-lg px-3 py-2 mt-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
            <button type="submit" disabled={busy || !subject.trim() || !body.trim()} className="bg-violet-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
              {busy ? 'Submitting…' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Tickets() {
  const { auth, logout } = useAuth();
  const nav = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await ticketApi.mine(auth.token);
      setTickets(r.tickets);
    } catch (e) {
      toast.error(e.message);
    } finally { setLoading(false); }
  }, [auth.token]);

  useEffect(() => { refresh(); }, [refresh]);

  async function createTicket(payload) {
    try {
      const r = await ticketApi.create(auth.token, payload);
      toast.success(`Ticket #${r.id} opened`);
      await refresh();
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <button onClick={() => nav('/dashboard')} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4"/> Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800 px-3 py-2">Logout</button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Ticket className="w-7 h-7 text-violet-600"/>
              My Tickets
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Reach out to HR or IT and track the conversation.</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="bg-violet-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-violet-700 flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4"/> New Ticket
          </button>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <div className="text-5xl">🎫</div>
            <p className="text-slate-600 mt-3">No tickets yet.</p>
            <p className="text-slate-400 text-sm mt-1">Click "New Ticket" or just chat with the 🤖 assistant.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => {
              const cat = catMeta[t.category];
              const st = statusStyle[t.status];
              return (
                <div key={t.id} onClick={() => nav(`/tickets/${t.id}`)} className="bg-white rounded-2xl shadow p-5 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="text-3xl">{cat?.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">{t.subject}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${st.badge}`}>{st.label}</span>
                      {t.ai_drafted && (
                        <span className="text-xs px-2 py-0.5 rounded bg-violet-100 text-violet-800 font-semibold">🤖 AI-drafted</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{cat?.label} · #{t.id}</p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {t.message_count} message{t.message_count > 1 ? 's' : ''} · last activity {timeAgo(t.last_activity_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <NewTicketModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={createTicket} />
    </div>
  );
}