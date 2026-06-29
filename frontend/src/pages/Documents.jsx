import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Plus,
  Printer,
  X,
  XCircle,
} from 'lucide-react';

import { useAuth } from '../auth/AuthContext';
import { documentApi } from '../api/documents';
import NotificationBell from '../components/NotificationBell';

const DOC_TYPES = [
  {
    code: 'EMPLOYMENT_LETTER',
    label: 'Employment Letter',
    icon: '💼',
    desc: 'Confirms your current employment',
  },
  {
    code: 'SALARY_CERTIFICATE',
    label: 'Salary Certificate',
    icon: '💰',
    desc: 'Salary details for visa, loans, etc.',
  },
  {
    code: 'EXPERIENCE_LETTER',
    label: 'Experience Letter',
    icon: '⭐',
    desc: 'Your role and duration at the company',
  },
  {
    code: 'ADDRESS_PROOF',
    label: 'Address Proof',
    icon: '🏠',
    desc: 'Verifies your registered address',
  },
  {
    code: 'NOC',
    label: 'No Objection (NOC)',
    icon: '✅',
    desc: 'For external activities or events',
  },
];

const docTypeMeta = Object.fromEntries(DOC_TYPES.map((d) => [d.code, d]));

const statusStyle = {
  pending: { badge: 'bg-amber-100 text-amber-800', icon: Clock },
  approved: { badge: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  rejected: { badge: 'bg-rose-100 text-rose-800', icon: XCircle },
};

function timeAgo(iso) {
  if (!iso) return '';

  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);

  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;

  return `${Math.floor(s / 86400)}d ago`;
}

// =====================================
// Request Modal — fixed height + scroll
// =====================================
function RequestModal({ open, onClose, onSubmit }) {
  const [docType, setDocType] = useState('EMPLOYMENT_LETTER');
  const [purpose, setPurpose] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    if (!purpose.trim() || busy) return;

    setBusy(true);

    try {
      await onSubmit(docType, purpose.trim());
      setPurpose('');
      setDocType('EMPLOYMENT_LETTER');
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Sticky header */}
        <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Request a Letter</h3>
            <p className="text-sm text-slate-500">Choose a document type and purpose.</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable body */}
          <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Letter Type
              </label>

              <div className="grid gap-2 mt-2">
                {DOC_TYPES.map((d) => (
                  <label
                    key={d.code}
                    className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer transition-colors ${
                      docType === d.code
                        ? 'border-violet-400 bg-violet-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="docType"
                      value={d.code}
                      checked={docType === d.code}
                      onChange={(e) => setDocType(e.target.value)}
                      className="mt-1"
                    />

                    <span className="text-xl">{d.icon}</span>

                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        {d.label}
                      </span>
                      <span className="block text-xs text-slate-500 mt-0.5">
                        {d.desc}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Purpose
              </label>

              <input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g., Bank loan application"
                className="w-full border rounded-lg px-3 py-2 mt-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                disabled={busy}
              />
            </div>
          </div>

          {/* Sticky footer */}
          <div className="px-6 py-4 border-t bg-white flex justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={busy || !purpose.trim()}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
            >
              {busy ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================
// Letter Modal — fixed height + scroll
// =====================================
function LetterModal({ open, onClose, document, token }) {
  const [busy, setBusy] = useState(null);

  if (!open || !document) return null;

  const meta = docTypeMeta[document.doc_type];

  async function downloadLetter() {
    setBusy('download');

    try {
      const blob = await documentApi.downloadPdf(token, document.id);
      const url = URL.createObjectURL(blob);

      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document.doc_type}_${document.id}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function printLetter() {
    setBusy('print');

    try {
      const blob = await documentApi.downloadPdf(token, document.id);
      const url = URL.createObjectURL(blob);

      const iframe = window.document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = url;

      window.document.body.appendChild(iframe);

      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();

        window.setTimeout(() => {
          iframe.remove();
          URL.revokeObjectURL(url);
        }, 1000);
      };
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Sticky header */}
        <div className="px-6 py-4 border-b flex items-center justify-between gap-4 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {meta?.label || document.doc_type}
            </h3>
            <p className="text-sm text-slate-500">
              Request #{document.id} · Approved document
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sticky action bar */}
        <div className="px-6 py-4 border-b bg-slate-50 flex flex-wrap gap-2 justify-end flex-shrink-0">
          <button
            onClick={printLetter}
            disabled={!!busy}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            {busy === 'print' ? 'Opening…' : 'Print PDF'}
          </button>

          <button
            onClick={downloadLetter}
            disabled={!!busy}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {busy === 'download' ? 'Preparing…' : 'Download PDF'}
          </button>
        </div>

        {/* Scrollable letter content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100">
          <pre className="bg-white border border-slate-200 rounded-xl p-5 whitespace-pre-wrap text-sm leading-relaxed text-slate-800 font-mono">
            {document.generated_content || 'Letter is being generated…'}
          </pre>
        </div>
      </div>
    </div>
  );
}

// =====================================
// Documents Page
// =====================================
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

  useEffect(() => {
    refresh();
  }, [refresh]);

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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center gap-4">
          <button
            onClick={() => nav('/dashboard')}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-2">
            <NotificationBell />

            <button
              onClick={logout}
              className="text-sm text-slate-500 hover:text-slate-800 px-3 py-2"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Page title */}
        <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>

              <div>
                <h1 className="text-3xl font-bold">My Documents</h1>
                <p className="text-violet-100 mt-1">
                  Request HR letters and track approval status.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setRequestOpen(true)}
            className="bg-white text-slate-900 rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-violet-50 flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Request a Letter
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-slate-500">
            Loading…
          </div>
        ) : docs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <p className="text-5xl">📄</p>
            <h2 className="font-bold text-slate-900 mt-4">No letter requests yet.</h2>
            <p className="text-slate-500 mt-1">
              Click “Request a Letter” above or ask the assistant.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {docs.map((d) => {
              const meta = docTypeMeta[d.doc_type];
              const status = statusStyle[d.status] || statusStyle.pending;
              const StatusIcon = status.icon;

              return (
                <div
                  key={d.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center text-3xl">
                    {meta?.icon || '📄'}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900">
                        {meta?.label || d.doc_type}
                      </h3>

                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${status.badge}`}>
                        <StatusIcon className="w-3 h-3" />
                        {d.status}
                      </span>

                      {d.ai_drafted && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 font-semibold">
                          🤖 AI-drafted
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-600 mt-1 italic">
                      “{d.purpose}”
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      Requested {timeAgo(d.created_at)}
                      {d.decided_at ? ` · decided ${timeAgo(d.decided_at)}` : ''}
                    </p>
                  </div>

                  {d.status === 'approved' && (
                    <button
                      onClick={() => viewLetter(d.id)}
                      className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      View letter
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <RequestModal
          open={requestOpen}
          onClose={() => setRequestOpen(false)}
          onSubmit={submitRequest}
        />

        <LetterModal
          open={!!viewDoc}
          onClose={() => setViewDoc(null)}
          document={viewDoc}
          token={auth.token}
        />
      </div>
    </div>
  );
}