import { API_BASE } from './config';

export async function getReportsOverview({ start, end }) {
  const res = await fetch(`${API_BASE}/reports/overview?start=${start}&end=${end}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load report data');
  return res.json();
}
