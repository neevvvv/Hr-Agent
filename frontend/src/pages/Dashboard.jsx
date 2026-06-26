import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, FileText } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { leaveApi } from '../api/leave';
import BalanceCards from '../components/BalanceCards';
import LeaveRequestForm from '../components/LeaveRequestForm';
import MyRequests from '../components/MyRequests';
import ChatBox from '../components/ChatBox';
import NotificationBell from '../components/NotificationBell';

export default function Dashboard() {
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
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Welcome, {auth.user.name} 👋
            </h1>
            <p className="text-slate-500 text-sm">Role: {auth.user.role}</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => nav('/profile')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              title="My Profile"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </button>
            <button
              onClick={() => nav('/documents')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              title="My Documents"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Documents</span>
            </button>
            <NotificationBell />
            <button
              onClick={logout}
              className="text-sm text-slate-500 hover:text-slate-800 px-3 py-2"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Error banner */}
        {err && <p className="text-red-600 text-sm">❌ {err}</p>}

        {/* Main content */}
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

      {/* Floating AI assistant */}
      <ChatBox onLeaveCreated={refresh} />
    </div>
  );
}