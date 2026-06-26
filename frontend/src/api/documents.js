import { api } from './client';

export const documentApi = {
  mine:     (token) => api('/documents/mine', { token }),
  create:   (token, body) => api('/documents', { method: 'POST', body, token }),
  view:     (token, id) => api(`/documents/${id}`, { token }),
  pending:  (token) => api('/documents/admin/pending', { token }),
  decide:   (token, id, decision) =>
    api(`/documents/${id}`, { method: 'PATCH', body: { decision }, token }),
};