import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Heart, Briefcase, History, ArrowLeft, Pencil, Check, X, Bot } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { profileApi } from '../api/profile';
import NotificationBell from '../components/NotificationBell';

const fieldLabel = {
  phone: 'Phone', email: 'Personal email',
  address_line1: 'Address line 1', address_line2: 'Address line 2',
  city: 'City', state: 'State', postal_code: 'Postal code', country: 'Country',
  emergency_contact_name: 'Emergency contact', emergency_contact_phone: 'Emergency phone',
  emergency_contact_relation: 'Relation', blood_group: 'Blood group',
};

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function EditableField({ icon: Icon, label, value, field, onSave, editable = true }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave(field, draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-violet-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
        {editing ? (
          <div className="flex gap-2 mt-1">
            <input
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
              className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
              disabled={saving}
            />
            <button onClick={save} disabled={saving} className="bg-emerald-600 text-white rounded-lg px-3 py-1.5 text-sm hover:bg-emerald-700 disabled:opacity-50">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => { setEditing(false); setDraft(value ?? ''); }} className="bg-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-sm hover:bg-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-sm text-slate-800 font-medium truncate">{value || <span className="text-slate-400 italic">not set</span>}</p>
            {editable && (
              <button onClick={() => setEditing(true)} className="text-slate-400 hover:text-violet-600 flex-shrink-0">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ReadOnlyField({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-slate-800 font-medium mt-0.5 truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const { auth, logout } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [p, h] = await Promise.all([
        profileApi.get(auth.token),
        profileApi.history(auth.token),
      ]);
      setProfile(p.profile);
      setHistory(h.history);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [auth.token]);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleSave(field, value) {
    try {
      await profileApi.update(auth.token, field, value, false);
      toast.success(`${fieldLabel[field]} updated`);
      await refresh();
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center text-slate-500">No profile found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <button onClick={() => nav('/dashboard')} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800 px-3 py-2">Logout</button>
          </div>
        </div>

        {/* Profile header card */}
        <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
            {profile.full_name?.split(' ').map(n => n[0]).slice(0,2).join('') || '?'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{profile.full_name}</h1>
            <p className="text-slate-500">{profile.job_title} · {profile.department}</p>
            <p className="text-xs text-slate-400 mt-1">Joined {profile.joined_on?.slice(0,10)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: editable sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-violet-600" /> Contact
              </h2>
              <EditableField icon={Phone} label="Phone" value={profile.phone} field="phone" onSave={handleSave} />
              <EditableField icon={Mail} label="Personal email" value={profile.email} field="email" onSave={handleSave} />
            </div>

            {/* Address */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-violet-600" /> Address
              </h2>
              <EditableField icon={MapPin} label="Address line 1" value={profile.address_line1} field="address_line1" onSave={handleSave} />
              <EditableField icon={MapPin} label="City" value={profile.city} field="city" onSave={handleSave} />
              <EditableField icon={MapPin} label="State" value={profile.state} field="state" onSave={handleSave} />
              <EditableField icon={MapPin} label="Postal code" value={profile.postal_code} field="postal_code" onSave={handleSave} />
            </div>

            {/* Emergency */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-violet-600" /> Emergency contact
              </h2>
              <EditableField icon={User} label="Name" value={profile.emergency_contact_name} field="emergency_contact_name" onSave={handleSave} />
              <EditableField icon={Phone} label="Phone" value={profile.emergency_contact_phone} field="emergency_contact_phone" onSave={handleSave} />
              <EditableField icon={User} label="Relation" value={profile.emergency_contact_relation} field="emergency_contact_relation" onSave={handleSave} />
            </div>
          </div>

          {/* Right: read-only + history */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-violet-600" /> Work info
              </h2>
              <ReadOnlyField icon={Briefcase} label="Job title" value={profile.job_title} />
              <ReadOnlyField icon={Briefcase} label="Department" value={profile.department} />
              <ReadOnlyField icon={Mail} label="Account email" value={profile.account_email} />
              <ReadOnlyField icon={User} label="Blood group" value={profile.blood_group} />
            </div>

            {/* History */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-violet-600" /> Recent changes
              </h2>
              {history.length === 0 ? (
                <p className="text-sm text-slate-500">No changes yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {history.slice(0, 8).map(h => (
                    <li key={h.id} className="border-l-2 border-violet-200 pl-3 py-1">
                      <p className="text-slate-800">
                        <strong>{fieldLabel[h.field] ?? h.field}</strong> changed
                        {h.ai_assisted && <Bot className="inline w-3 h-3 ml-1 text-violet-600" />}
                      </p>
                      <p className="text-xs text-slate-500">
                        {h.old_value || '∅'} → {h.new_value || '∅'}
                      </p>
                      <p className="text-[11px] text-slate-400">{timeAgo(h.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}