import { API_BASE, parseJsonOrThrow } from './config';

export async function getDashboardOverview({ start, end }) {
  const res = await fetch(`${API_BASE}/dashboard/overview?start=${start}&end=${end}`, { credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to load dashboard data');
}
