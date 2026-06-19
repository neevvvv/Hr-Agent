import { api } from './client';

export const agentApi = {
  chat: (token, message, history = []) =>
    api('/agent/chat', { method: 'POST', body: { message, history }, token }),
};