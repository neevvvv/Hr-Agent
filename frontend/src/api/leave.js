import { api } from './client';

export const leaveApi = {
  balance: (token) => api('/leave/balance', { token }),
  mine: (token) => api('/leave/mine', { token }),
  create: (token, body) => api('/leave', { method: 'POST', body, token }),
  pending: (token) => api('/leave/pending', { token }),
  decide: (token, id, decision) =>
    api(`/leave/${id}`, { method: 'PATCH', body: { decision }, token }),
};