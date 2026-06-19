import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { leaveApi } from '../api/leave';

const typeStyle = {
  ANNUAL: 'bg-emerald-100 text-emerald-800',
  SICK:   'bg-rose-100 text-rose-800',
  CASUAL: 'bg-amber-100 text-amber-800',
};

export default function AdminQueue() {
  const { auth, logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');

  const refresh = useCallback(async () => {
    setErr('');
    try {
      const r = await leaveApi.pending(auth.token);
      setRequests(r.requests);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [auth.token]);

  useEffect(() => { refresh(); }, [refresh]);

  async function decide(id, decision) {
    setBusyId(id);
    setErr('');
    try {
      await leaveApi.decide(auth.token, id, decision);
      setToast(`Request #${id} ${decision} ✅`);
      setTimeout(() => setToast(''), 2500);
      await refresh();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              HR Approval Queue
            </h1>
            <p className="text-slate-500 text-sm">Signed in as <strong>{auth.user.name}</strong> · {auth.user.role}</p>
          </div>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800">Logout</button>
        </div>

        {/* Stats strip */}
        <div className="bg-white rounded-2xl shadow p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-slate-500 tracking-wider">Pending requests</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{requests.length}</p>
          </div>
          <button onClick={refresh} className="text-sm text-slate-500 hover:text-slate-800">
            🔄 Refresh
          </button>
        </div>

        {err && <p className="text-red-600 text-sm">❌ {err}</p>}
        {toast && <p className="text-emerald-700 text-sm">{toast}</p>}

        {/* Queue */}
        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <p className="text-4xl">🎉</p>
            <p className="text-slate-600 mt-2">Inbox zero! No pending requests.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(r => (
              <div key={r.id} className="bg-white rounded-2xl shadow p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800">{r.employee}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${typeStyle[r.leave_type]}`}>
                      {r.leave_type}
                    </span>
                    {r.ai_drafted ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-violet-100 text-violet-800 font-semibold">
                        🤖 AI-drafted
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    {r.start_date} → {r.end_date} · <strong>{r.days} day{r.days > 1 ? 's' : ''}</strong>
                  </p>
                  {r.reason && (
                    <p className="text-sm text-slate-500 mt-1 italic">"{r.reason}"</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">Submitted {new Date(r.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={busyId === r.id}
                    onClick={() => decide(r.id, 'approved')}
                    className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                  >
                    ✅ Approve
                  </button>
                  <button
                    disabled={busyId === r.id}
                    onClick={() => decide(r.id, 'rejected')}
                    className="bg-rose-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}