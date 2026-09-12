import { API_BASE } from './config';

export async function getDashboardOverview({ start, end }) {
  const res = await fetch(`${API_BASE}/dashboard/overview?start=${start}&end=${end}`);
  if (!res.ok) throw new Error('Failed to load dashboard data');
  return res.json();
}
