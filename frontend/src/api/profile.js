import { api } from './client';

export const profileApi = {
  get:     (token) => api('/profile', { token }),
  history: (token) => api('/profile/history', { token }),
  update:  (token, field, value, ai_assisted = false) =>
    api('/profile', { method: 'PATCH', body: { field, value, ai_assisted }, token }),
};