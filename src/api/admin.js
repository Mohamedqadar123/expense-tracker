import { API_BASE, parseJsonOrThrow } from './config';

export async function getAdminOverview() {
  const res = await fetch(`${API_BASE}/admin/overview`, { credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to load admin dashboard');
}
