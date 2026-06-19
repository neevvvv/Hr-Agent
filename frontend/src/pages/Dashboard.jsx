import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { leaveApi } from '../api/leave';
import BalanceCards from '../components/BalanceCards';
import LeaveRequestForm from '../components/LeaveRequestForm';
import MyRequests from '../components/MyRequests';
import ChatBox from '../components/ChatBox';        // ← NEW

export default function Dashboard() {
  const { auth, logout } = useAuth();
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome, {auth.user.name} 👋</h1>
            <p className="text-slate-500 text-sm">Role: {auth.user.role}</p>
          </div>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800">Logout</button>
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

      {/* Floating AI assistant — visible everywhere on the dashboard */}
      <ChatBox onLeaveCreated={refresh} />
    </div>
  );
}