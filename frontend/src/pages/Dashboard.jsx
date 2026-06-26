import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar, FileText, Ticket, User, Brain,
  CheckCircle2, Sparkles, ArrowRight,
  Home as HomeIcon,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { getOverview } from '../api/activity';
import ChatBox from '../components/ChatBox';
import NotificationBell from '../components/NotificationBell';

const QUICK_ACTIONS = [
  { code: 'leave', label: 'Request Leave',  icon: '🌴', desc: 'Submit a new leave request',  color: 'emerald', path: '/leave' },
  { code: 'doc',   label: 'Get a Letter',    icon: '📄', desc: 'Employment / salary letter',  color: 'sky',     path: '/documents' },
  { code: 'tkt',   label: 'Open a Ticket',   icon: '🎫', desc: 'HR / IT / Payroll issue',      color: 'rose',    path: '/tickets' },
  { code: 'prof',  label: 'Update Profile',  icon: '👤', desc: 'Phone, address, emergency',    color: 'violet',  path: '/profile' },
];

// Safelist lookups — Tailwind needs literal class names at build time
const cardHoverClasses = {
  emerald: 'hover:border-emerald-400 hover:bg-emerald-50',
  sky:     'hover:border-sky-400 hover:bg-sky-50',
  rose:    'hover:border-rose-400 hover:bg-rose-50',
  violet:  'hover:border-violet-400 hover:bg-violet-50',
};
const arrowHoverClasses = {
  emerald: 'group-hover:text-emerald-600',
  sky:     'group-hover:text-sky-600',
  rose:    'group-hover:text-rose-600',
  violet:  'group-hover:text-violet-600',
};

const NAV_LINKS = [
  { path: '/dashboard', label: 'Home',      icon: HomeIcon },
  { path: '/leave',     label: 'Leave',     icon: Calendar },
  { path: '/profile',   label: 'Profile',   icon: User },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/tickets',   label: 'Tickets',   icon: Ticket },
  { path: '/memories',  label: 'Memory',    icon: Brain },
];

const notifIcon = (kind) => ({
  leave_approved: '✅',
  leave_rejected: '❌',
  new_request:    '📥',
  doc_approved:   '📄',
  doc_rejected:   '❌',
  ticket_reply:   '💬',
  ticket_status:  '🎫',
  new_ticket:     '🎫',
}[kind] || '🔔');

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', emoji: '🌞' };
  if (h < 17) return { text: 'Good afternoon', emoji: '☀️' };
  if (h < 21) return { text: 'Good evening', emoji: '🌇' };
  return { text: 'Working late?', emoji: '🌙' };
}

export default function Dashboard() {
  const { auth, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const o = await getOverview(auth.token);
      setData(o);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [auth.token]);

  useEffect(() => { refresh(); }, [refresh]);

  const greeting = getGreeting();
  const firstName = (auth.user.name || '').split(' ')[0];
  const annualBal = data?.balances?.find(b => b.code === 'ANNUAL');
  const sickBal   = data?.balances?.find(b => b.code === 'SICK');
  const casualBal = data?.balances?.find(b => b.code === 'CASUAL');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto">
            {NAV_LINKS.map(l => {
              const active = pathname === l.path;
              return (
                <button
                  key={l.path}
                  onClick={() => nav(l.path)}
                  className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-violet-100 text-violet-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <l.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{l.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <NotificationBell />
            <button
              onClick={logout}
              className="text-sm text-slate-500 hover:text-slate-800 px-3 py-2"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Hero greeting */}
        <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-violet-100 text-sm">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold mt-1">
                {greeting.text}, {firstName} {greeting.emoji}
              </h1>
              <p className="text-violet-100 mt-2 text-sm sm:text-base">
                What would you like to do today?
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 text-right">
              <p className="text-xs uppercase text-violet-100 tracking-wider">Annual leave</p>
              <p className="text-3xl font-bold">
                {annualBal?.remaining ?? '—'}
                <span className="text-base font-normal text-violet-100">
                  {' '}/ {annualBal?.annual_quota ?? '—'}
                </span>
              </p>
              <p className="text-xs text-violet-100">days remaining</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => nav('/leave')}
            className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <p className="text-xs uppercase text-slate-500 tracking-wider">Sick leave</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{sickBal?.remaining ?? '—'}</p>
            <p className="text-xs text-slate-400">of {sickBal?.annual_quota ?? '—'} days</p>
          </button>
          <button
            onClick={() => nav('/leave')}
            className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <p className="text-xs uppercase text-slate-500 tracking-wider">Casual leave</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{casualBal?.remaining ?? '—'}</p>
            <p className="text-xs text-slate-400">of {casualBal?.annual_quota ?? '—'} days</p>
          </button>
          <button
            onClick={() => nav('/leave')}
            className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <p className="text-xs uppercase text-slate-500 tracking-wider">Pending</p>
            <p className="text-2xl font-bold text-violet-600 mt-1">{data?.pending_leaves ?? 0}</p>
            <p className="text-xs text-slate-400">leave requests</p>
          </button>
          <div className="bg-white p-4 rounded-2xl shadow-sm">
            <p className="text-xs uppercase text-slate-500 tracking-wider">Unread</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{data?.unread_count ?? 0}</p>
            <p className="text-xs text-slate-400">notifications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Quick actions</h2>
            <p className="text-sm text-slate-500 mb-4">
              Or just ask the AI assistant in the bottom-right ↘️
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUICK_ACTIONS.map(a => (
                <button
                  key={a.code}
                  onClick={() => nav(a.path)}
                  className={`group p-4 rounded-xl border-2 border-slate-100 text-left transition-all ${cardHoverClasses[a.color]}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{a.icon}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{a.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{a.desc}</p>
                    </div>
                    <ArrowRight className={`w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-all flex-shrink-0 ${arrowHoverClasses[a.color]}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-slate-900">Activity</h2>
              {data?.unread_count > 0 && (
                <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-semibold">
                  {data.unread_count} new
                </span>
              )}
            </div>
            {loading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : !data?.notifications?.length ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm text-slate-500 mt-2">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {data.notifications.slice(0, 8).map(n => (
                  <div
                    key={n.id}
                    onClick={() => n.link && nav(n.link)}
                    className={`flex gap-2 items-start p-2 rounded-lg cursor-pointer hover:bg-slate-50 ${
                      !n.read_at ? 'bg-violet-50/40' : ''
                    }`}
                  >
                    <span className="text-lg flex-shrink-0">{notifIcon(n.kind)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 leading-snug">{n.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read_at && (
                      <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI hint card */}
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-white text-xl flex-shrink-0">
            🤖
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
              Try the AI assistant
              <Sparkles className="w-4 h-4 text-violet-500" />
            </p>
            <p className="text-sm text-slate-600 mt-0.5">
              Ask "plan my Diwali week off" or "I need a salary letter for a loan" — it can take action for you with multi-step reasoning.
            </p>
          </div>
        </div>
      </div>

      {/* Floating AI assistant */}
      <ChatBox onLeaveCreated={refresh} />
    </div>
  );
}