import { api } from './client';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// =====================================
// Download approved PDF as a Blob
// =====================================
async function fetchPdfBlob(token, id) {
  const res = await fetch(`${API}/documents/${id}/pdf`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // Auto-logout on 401 — token expired or invalid
  if (res.status === 401) {
    localStorage.removeItem('auth');

    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }

    throw new Error('Session expired. Please sign in again.');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return res.blob();
}

// =====================================
// Document API
// =====================================
export const documentApi = {
  mine: (token) =>
    api('/documents/mine', { token }),

  create: (token, body) =>
    api('/documents', {
      method: 'POST',
      body,
      token,
    }),

  view: (token, id) =>
    api(`/documents/${id}`, { token }),

  pending: (token) =>
    api('/documents/admin/pending', { token }),

  decide: (token, id, decision) =>
    api(`/documents/${id}`, {
      method: 'PATCH',
      body: { decision },
      token,
    }),

  downloadPdf: (token, id) =>
    fetchPdfBlob(token, id),
};