import { API_BASE, parseJsonOrThrow } from './config';

export async function getReportsOverview({ start, end }) {
  const res = await fetch(`${API_BASE}/reports/overview?start=${start}&end=${end}`, { credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to load report data');
}
