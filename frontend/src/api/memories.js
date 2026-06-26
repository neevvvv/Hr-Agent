import { api } from './client';

export const memoryApi = {
  list:   (token) => api('/memories', { token }),
  create: (token, content) => api('/memories', { method: 'POST', body: { content }, token }),
  delete: (token, id) => api(`/memories/${id}`, { method: 'DELETE', token }),
};