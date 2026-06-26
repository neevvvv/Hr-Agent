import { api } from './client';
import { notificationApi } from './notifications';
import { leaveApi } from './leave';
import { ticketApi } from './tickets';

export async function getOverview(token) {
  const [notifs, balance, mine] = await Promise.all([
    notificationApi.list(token).catch(() => ({ notifications: [], unread_count: 0 })),
    leaveApi.balance(token).catch(() => ({ balances: [] })),
    leaveApi.mine(token).catch(() => ({ requests: [] })),
  ]);

  const pendingLeaves = mine.requests.filter(r => r.status === 'pending').length;

  return {
    notifications: notifs.notifications,
    unread_count: notifs.unread_count,
    balances: balance.balances,
    pending_leaves: pendingLeaves,
  };
}