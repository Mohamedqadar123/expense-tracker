import { API_BASE, apiFetch, parseJsonOrThrow } from './config';

export async function getReportsOverview({ start, end }) {
  const res = await apiFetch(`${API_BASE}/reports/overview?start=${start}&end=${end}`, { credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to load report data');
}
