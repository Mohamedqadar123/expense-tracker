import { API_BASE, apiFetch, parseJsonOrThrow } from './config';

export async function getAdminOverview() {
  const res = await apiFetch(`${API_BASE}/admin/overview`, { credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to load admin dashboard');
}
