import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../auth/AuthContext';
import { leaveApi } from '../api/leave';
import { documentApi } from '../api/documents';
import { ticketApi } from '../api/tickets';
import NotificationBell from '../components/NotificationBell';

const leaveTypeStyle = {
  ANNUAL: 'bg-emerald-100 text-emerald-800',
  SICK:   'bg-rose-100 text-rose-800',
  CASUAL: 'bg-amber-100 text-amber-800',
};

const docTypeLabels = {
  EMPLOYMENT_LETTER:  'Employment Letter',
  SALARY_CERTIFICATE: 'Salary Certificate',
  EXPERIENCE_LETTER:  'Experience Letter',
  ADDRESS_PROOF:      'Address Proof',
  NOC:                'No Objection Certificate',
};

const docTypeIcons = {
  EMPLOYMENT_LETTER:  '💼',
  SALARY_CERTIFICATE: '💰',
  EXPERIENCE_LETTER:  '⭐',
  ADDRESS_PROOF:      '🏠',
  NOC:                '✅',
};

const ticketCategoryIcons = {
  PAYROLL: '💰', IT: '💻', BENEFITS: '🏥', POLICY: '📋', GENERAL: '💬',
};

export default function AdminQueue() {
  const { auth, logout } = useAuth();
  const nav = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [docs, setDocs] = useState([]);
  const [openTickets, setOpenTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState('');

  const refresh = useCallback(async () => {
    setErr('');
    try {
      const [l, d, t] = await Promise.all([
        leaveApi.pending(auth.token),
        documentApi.pending(auth.token).catch(() => ({ requests: [] })),
        ticketApi.adminList(auth.token, 'open').catch(() => ({ tickets: [] })),
      ]);
      setLeaves(l.requests);
      setDocs(d.requests);
      setOpenTickets(t.tickets);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [auth.token]);

  useEffect(() => { refresh(); }, [refresh]);

  async function decideLeave(id, decision) {
    setBusyId(`leave-${id}`);
    try {
      await leaveApi.decide(auth.token, id, decision);
      toast.success(`Leave #${id} ${decision}`);
      await refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function decideDoc(id, decision) {
    setBusyId(`doc-${id}`);
    try {
      await documentApi.decide(auth.token, id, decision);
      toast.success(decision === 'approved' ? `Letter generated for #${id}` : `Document #${id} rejected`);
      await refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  const totalPending = leaves.length + docs.length + openTickets.length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">HR Approval Queue</h1>
            <p className="text-slate-500 text-sm">
              Signed in as <strong>{auth.user.name}</strong> · {auth.user.role}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={logout}
              className="text-sm text-slate-500 hover:text-slate-800 px-3 py-2"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="bg-white rounded-2xl shadow p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-slate-500 tracking-wider">Pending items</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{totalPending}</p>
            <p className="text-xs text-slate-500 mt-1">
              {leaves.length} leave{leaves.length !== 1 ? 's' : ''} ·{' '}
              {docs.length} document{docs.length !== 1 ? 's' : ''} ·{' '}
              {openTickets.length} ticket{openTickets.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={refresh}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            🔄 Refresh
          </button>
        </div>

        {err && <p className="text-red-600 text-sm">❌ {err}</p>}

        {/* Inbox zero */}
        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : totalPending === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <p className="text-4xl">🎉</p>
            <p className="text-slate-600 mt-2">Inbox zero! No pending items.</p>
          </div>
        ) : (
          <>
            {/* TICKETS */}
            {openTickets.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-2 flex items-center gap-2">
                  🎫 Open tickets
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                    {openTickets.length}
                  </span>
                </h2>
                {openTickets.map(t => (
                  <div
                    key={t.id}
                    onClick={() => nav(`/tickets/${t.id}`)}
                    className="bg-white rounded-2xl shadow p-5 flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{ticketCategoryIcons[t.category]}</div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-800">{t.subject}</h3>
                          <span className="text-xs px-2 py-0.5 rounded font-semibold bg-amber-100 text-amber-800">
                            {t.category}
                          </span>
                          {t.ai_drafted && (
                            <span className="text-xs px-2 py-0.5 rounded bg-violet-100 text-violet-800 font-semibold">
                              🤖 AI-drafted
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          From <strong>{t.employee_name}</strong> · #{t.id} · {t.message_count} message{t.message_count > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-violet-600 font-medium">Open →</span>
                  </div>
                ))}
              </div>
            )}

            {/* DOCUMENT REQUESTS */}
            {docs.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-4 flex items-center gap-2">
                  📄 Document requests
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                    {docs.length}
                  </span>
                </h2>
                {docs.map(d => (
                  <div
                    key={d.id}
                    className="bg-white rounded-2xl shadow p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className="text-3xl">{docTypeIcons[d.doc_type]}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-800">{d.employee}</h3>
                        <span className="text-xs px-2 py-0.5 rounded font-semibold bg-violet-100 text-violet-800">
                          {docTypeLabels[d.doc_type]}
                        </span>
                        {d.ai_drafted && (
                          <span className="text-xs px-2 py-0.5 rounded bg-violet-100 text-violet-800 font-semibold">
                            🤖 AI-drafted
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1 italic">"{d.purpose}"</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Submitted {new Date(d.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={busyId === `doc-${d.id}`}
                        onClick={() => decideDoc(d.id, 'approved')}
                        className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                      >
                        ✅ Approve & Generate
                      </button>
                      <button
                        disabled={busyId === `doc-${d.id}`}
                        onClick={() => decideDoc(d.id, 'rejected')}
                        className="bg-rose-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LEAVE REQUESTS */}
            {leaves.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-4 flex items-center gap-2">
                  🌴 Leave requests
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                    {leaves.length}
                  </span>
                </h2>
                {leaves.map(r => (
                  <div
                    key={r.id}
                    className="bg-white rounded-2xl shadow p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-800">{r.employee}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${leaveTypeStyle[r.leave_type]}`}>
                          {r.leave_type}
                        </span>
                        {r.ai_drafted && (
                          <span className="text-xs px-2 py-0.5 rounded bg-violet-100 text-violet-800 font-semibold">
                            🤖 AI-drafted
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {r.start_date} → {r.end_date} ·{' '}
                        <strong>{r.days} day{r.days > 1 ? 's' : ''}</strong>
                      </p>
                      {r.reason && (
                        <p className="text-sm text-slate-500 mt-1 italic">"{r.reason}"</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        Submitted {new Date(r.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={busyId === `leave-${r.id}`}
                        onClick={() => decideLeave(r.id, 'approved')}
                        className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                      >
                        ✅ Approve
                      </button>
                      <button
                        disabled={busyId === `leave-${r.id}`}
                        onClick={() => decideLeave(r.id, 'rejected')}
                        className="bg-rose-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}