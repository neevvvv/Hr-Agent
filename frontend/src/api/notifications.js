import { api } from './client';

export const notificationApi = {
  list: (token) => api('/notifications', { token }),
  markRead: (token, ids = null) =>
    api('/notifications/mark-read', { method: 'POST', body: { ids }, token }),
};
