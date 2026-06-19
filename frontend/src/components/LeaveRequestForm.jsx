import { useState } from 'react';
import { leaveApi } from '../api/leave';
import { useAuth } from '../auth/AuthContext';

export default function LeaveRequestForm({ onSubmitted }) {
  const { auth } = useAuth();
  const [leave_type, setType] = useState('ANNUAL');
  const [start_date, setStart] = useState('');
  const [end_date, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(''); setOk(''); setLoading(true);
    try {
      const r = await leaveApi.create(auth.token, { leave_type, start_date, end_date, reason });
      setOk(`✅ Submitted (${r.days} day${r.days > 1 ? 's' : ''}). Status: ${r.status}`);
      setStart(''); setEnd(''); setReason('');
      onSubmitted?.();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl shadow p-6 space-y-4">
      <h2 className="text-lg font-bold text-slate-800">Request Leave</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-slate-600">Type</label>
          <select value={leave_type} onChange={e => setType(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1">
            <option value="ANNUAL">Annual</option>
            <option value="SICK">Sick</option>
            <option value="CASUAL">Casual</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-600">Start</label>
          <input type="date" required value={start_date} onChange={e => setStart(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" />
        </div>
        <div>
          <label className="text-xs text-slate-600">End</label>
          <input type="date" required value={end_date} onChange={e => setEnd(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-600">Reason (optional)</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2 mt-1" />
      </div>
      {err && <p className="text-red-600 text-sm">❌ {err}</p>}
      {ok && <p className="text-emerald-700 text-sm">{ok}</p>}
      <button disabled={loading} className="bg-slate-800 text-white rounded-lg px-5 py-2 font-medium hover:bg-slate-700 disabled:opacity-50">
        {loading ? 'Submitting…' : 'Submit Request'}
      </button>
    </form>
  );
}