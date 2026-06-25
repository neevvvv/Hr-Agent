import { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { notificationApi } from '../api/notifications';

const iconFor = (kind) => {
  switch (kind) {
    case 'leave_approved':   return '✅';
    case 'leave_rejected':   return '❌';
    case 'new_request':      return '📥';
    default:                 return '🔔';
  }
};

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export default function NotificationBell() {
  const { auth } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const wrapRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const r = await notificationApi.list(auth.token);
      setItems(r.notifications);
      setUnread(r.unread_count);
    } catch (e) {
      console.error('notifications:', e);
    }
  }, [auth.token]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function markAllRead() {
    await notificationApi.markRead(auth.token);
    setUnread(0);
    setItems((s) => s.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-700" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="font-semibold text-slate-800">Notifications</p>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-violet-600 hover:text-violet-700 font-medium inline-flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                You're all caught up. 🎉
              </div>
            ) : items.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b border-slate-50 flex gap-3 ${
                  !n.read_at ? 'bg-violet-50/40' : ''
                }`}
              >
                <div className="text-xl">{iconFor(n.kind)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{n.title}</p>
                  {n.body && <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>}
                  <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read_at && (
                  <div className="w-2 h-2 mt-2 rounded-full bg-violet-500 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}