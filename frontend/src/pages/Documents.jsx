import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileText, ArrowLeft, Plus, Download, Printer, CheckCircle2, Clock, XCircle, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { documentApi } from '../api/documents';
import NotificationBell from '../components/NotificationBell';

const DOC_TYPES = [
  { code: 'EMPLOYMENT_LETTER',  label: 'Employment Letter', icon: '💼', desc: 'Confirms your current employment' },
  { code: 'SALARY_CERTIFICATE', label: 'Salary Certificate', icon: '💰', desc: 'Salary details for visa, loans, etc.' },
  { code: 'EXPERIENCE_LETTER',  label: 'Experience Letter',  icon: '⭐', desc: 'Your role + duration at the company' },
  { code: 'ADDRESS_PROOF',      label: 'Address Proof',       icon: '🏠', desc: 'Verifies your registered address' },
  { code: 'NOC',                label: 'No Objection (NOC)',  icon: '✅', desc: 'For external activities or events' },
];

const docTypeMeta = Object.fromEntries(DOC_TYPES.map(d => [d.code, d]));

const statusStyle = {
  pending:  { badge: 'bg-amber-100 text-amber-800', icon: Clock },
  approved: { badge: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  rejected: { badge: 'bg-rose-100 text-rose-800', icon: XCircle },
};

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function RequestModal({ open, onClose, onSubmit }) {
  const [docType, setDocType] = useState('EMPLOYMENT_LETTER');
  const [purpose, setPurpose] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    if (!purpose.trim()) return;
    setBusy(true);
    try {
      await onSubmit(docType, purpose);
      setPurpose('');
      onClose();
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-slate-900">Request a Letter</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5"/></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">Letter Type</label>
            <div className="mt-2 grid grid-cols-1 gap-2 max-h-72 overflow-y-auto">
              {DOC_TYPES.map(d => (
                <label key={d.code} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${docType === d.code ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="doc_type" value={d.code} checked={docType === d.code} onChange={e => setDocType(e.target.value)} className="mt-1" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 flex items-center gap-2">
                      <span>{d.icon}</span>{d.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{d.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">Purpose</label>
            <input
              autoFocus
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="e.g., Bank loan application"
              className="w-full border rounded-lg px-3 py-2 mt-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</button>
            <button type="submit" disabled={busy || !purpose.trim()} className="bg-violet-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
              {busy ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LetterModal({ open, onClose, document }) {
  if (!open || !document) return null;

  function printLetter() {
    const w = window.open('', '_blank');
    w.document.write(`<pre style="font-family: 'Courier New', monospace; padding: 40px; white-space: pre-wrap;">${document.generated_content}</pre>`);
    w.document.close();
    w.print();
  }

  function downloadLetter() {
    const blob = new Blob([document.generated_content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.doc_type}_${document.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-slate-900">
            {docTypeMeta[document.doc_type]?.label}
          </h2>
          <div className="flex gap-2 items-center">
            <button onClick={printLetter} className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1 px-3 py-1.5 rounded hover:bg-slate-100">
              <Printer className="w-4 h-4"/> Print
            </button>
            <button onClick={downloadLetter} className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1 px-3 py-1.5 rounded hover:bg-slate-100">
              <Download className="w-4 h-4"/> Download
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5"/></button>
          </div>
        </div>
        <pre className="flex-1 overflow-y-auto p-6 font-mono text-xs text-slate-800 whitespace-pre-wrap bg-slate-50">
          {document.generated_content || 'Letter is being generated…'}
        </pre>
      </div>
    </div>
  );
}

export default function Documents() {
  const { auth, logout } = useAuth();
  const nav = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const r = await documentApi.mine(auth.token);
      setDocs(r.requests);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [auth.token]);

  useEffect(() => { refresh(); }, [refresh]);

  async function submitRequest(doc_type, purpose) {
    try {
      const r = await documentApi.create(auth.token, { doc_type, purpose });
      toast.success(`Request #${r.id} submitted`);
      await refresh();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function viewLetter(id) {
    try {
      const r = await documentApi.view(auth.token, id);
      setViewDoc(r.document);
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <button onClick={() => nav('/dashboard')} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4"/> Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800 px-3 py-2">Logout</button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-7 h-7 text-violet-600"/>
              My Documents
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Request HR letters and track their status.</p>
          </div>
          <button onClick={() => setRequestOpen(true)} className="bg-violet-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-violet-700 flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4"/> Request a Letter
          </button>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : docs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <div className="text-5xl">📄</div>
            <p className="text-slate-600 mt-3">No letter requests yet.</p>
            <p className="text-slate-400 text-sm mt-1">Click "Request a Letter" above or just ask the 🤖 assistant!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map(d => {
              const meta = docTypeMeta[d.doc_type];
              const StatusIcon = statusStyle[d.status].icon;
              return (
                <div key={d.id} className="bg-white rounded-2xl shadow p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="text-3xl">{meta?.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{meta?.label || d.doc_type}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold inline-flex items-center gap-1 ${statusStyle[d.status].badge}`}>
                        <StatusIcon className="w-3 h-3"/>{d.status}
                      </span>
                      {d.ai_drafted && (
                        <span className="text-xs px-2 py-0.5 rounded bg-violet-100 text-violet-800 font-semibold">🤖 AI-drafted</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1 italic">"{d.purpose}"</p>
                    <p className="text-xs text-slate-400 mt-1">Requested {timeAgo(d.created_at)}</p>
                  </div>
                  {d.status === 'approved' && (
                    <button onClick={() => viewLetter(d.id)} className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
                      <FileText className="w-4 h-4"/> View letter
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RequestModal open={requestOpen} onClose={() => setRequestOpen(false)} onSubmit={submitRequest} />
      <LetterModal open={!!viewDoc} onClose={() => setViewDoc(null)} document={viewDoc} />
    </div>
  );
}