import { api } from './client';

export const ticketApi = {
  mine:        (token) => api('/tickets/mine', { token }),
  get:         (token, id) => api(`/tickets/${id}`, { token }),
  create:      (token, body) => api('/tickets', { method: 'POST', body, token }),
  reply:       (token, id, body) => api(`/tickets/${id}/reply`, { method: 'POST', body: { body }, token }),
  setStatus:   (token, id, status) => api(`/tickets/${id}/status`, { method: 'PATCH', body: { status }, token }),
  adminList:   (token, status) => api(`/tickets/admin/all${status ? `?status=${status}` : ''}`, { token }),
};