import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hotucide-react';import toast from 'react-hot-toast';
import { useAuth } from '../auth/AuthContext';
import { memoryApi } from '../api/memories';
import NotificationBell from '../components/NotificationBell';

const sourceMeta = {
  explicit:   { label: 'You told me',  icon: UserIcon, color: 'violet' },
  auto:       { label: 'Auto-captured', icon: Wand2,    color: 'indigo' },
  preference: { label: 'Preference',    icon: Sparkles, color: 'emerald' },
};

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export default function Memories() {
  const { auth, logout } = useAuth();
  const nav = useNavigate();
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMem, setNewMem] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await memoryApi.list(auth.token);
      setMemories(r.memories);
    } catch (e) {
      toast.error(e.message);
    } finally { setLoading(false); }
  }, [auth.token]);

  useEffect(() => { refresh(); }, [refresh]);

  async function add(e) {
    e.preventDefault();
    if (!newMem.trim() || busy) return;
    setBusy(true);
    try {
      await memoryApi.create(auth.token, newMem.trim());
      toast.success('Memory saved');
      setNewMem('');
      await refresh();
    } catch (e) {
      toast.error(e.message);
    } finally { setBusy(false); }
  }

  async function remove(id) {
    if (!confirm('Forget this memory?')) return;
    try {
      await memoryApi.delete(auth.token, id);
      toast.success('Forgotten');
      setMemories(m => m.filter(x => x.id !== id));
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <button onClick={() => nav('/dashboard')} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4"/> Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800 px-3 py-2">Logout</button>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Brain className="w-7 h-7 text-violet-600"/>
            What I remember about you
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            These are facts the AI uses to personalize answers. You're always in control — delete anything anytime.
          </p>
        </div>

        {/* Add new */}
        <form onSubmit={add} className="bg-white rounded-2xl shadow p-4 flex gap-2">
          <input
            value={newMem}
            onChange={e => setNewMem(e.target.value)}
            placeholder='e.g., "I work remotely on Wednesdays"'
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            disabled={busy}
          />
          <button type="submit" disabled={busy || !newMem.trim()} className="bg-violet-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2">
            <Plus className="w-4 h-4"/> Save
          </button>
        </form>

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : memories.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <div className="text-5xl">🧠</div>
            <p className="text-slate-600 mt-3">I don't know anything about you yet.</p>
            <p className="text-slate-400 text-sm mt-1">Just chat with the 🤖 assistant — I'll learn your preferences naturally.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {memories.map(m => {
              const meta = sourceMeta[m.source] || sourceMeta.explicit;
              const Icon = meta.icon;
              return (
                <div key={m.id} className="bg-white rounded-xl shadow-sm p-4 flex items-start gap-3 group hover:shadow-md transition-shadow">
                  <div className={`w-9 h-9 rounded-lg bg-${meta.color}-100 flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 text-${meta.color}-600`}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800">{m.content}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {meta.label} · {timeAgo(m.created_at)}
                      {m.last_used_at && <> · last used {timeAgo(m.last_used_at)}</>}
                    </p>
                  </div>
                  <button onClick={() => remove(m.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity" title="Forget this">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
