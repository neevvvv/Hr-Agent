import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { leaveApi } from '../api/leave';
import BalanceCards from '../components/BalanceCards';
import LeaveRequestForm from '../components/LeaveRequestForm';
import MyRequests from '../components/MyRequests';
import NotificationBell from '../components/NotificationBell';

export default function Leave() {
  const { auth, logout } = useAuth();
  const nav = useNavigate();
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const refresh = useCallback(async () => {
    setErr('');
    try {
      const [b, m] = await Promise.all([
        leaveApi.balance(auth.token),
        leaveApi.mine(auth.token),
      ]);
      setBalances(b.balances);
      setRequests(m.requests);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [auth.token]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <button onClick={() => nav('/dashboard')} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800 px-3 py-2">Logout</button>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-slate-900">🌴 Leave</h1>
          <p className="text-slate-500 mt-1 text-sm">Check your balance, request time off, and view your history.</p>
        </div>

        {err && <p className="text-red-600 text-sm">❌ {err}</p>}

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : (
          <>
            <BalanceCards balances={balances} />
            <LeaveRequestForm onSubmitted={refresh} />
            <MyRequests requests={requests} />
          </>
        )}
      </div>
    </div>
  );
}