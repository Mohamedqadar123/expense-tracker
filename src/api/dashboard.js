import { API_BASE, apiFetch, parseJsonOrThrow } from './config';

export async function getDashboardOverview({ start, end }) {
  const res = await apiFetch(`${API_BASE}/dashboard/overview?start=${start}&end=${end}`, { credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to load dashboard data');
}
