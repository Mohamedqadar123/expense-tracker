import { API_BASE, apiFetch, parseJsonOrThrow } from './config';

export async function getAdminOverview() {
  const res = await apiFetch(`${API_BASE}/admin/overview`, { credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to load admin dashboard');
}

// reason: 'non_payment' or 'terms_violation' (server/src/constants/moderation.js).
export async function suspendUser(id, reason) {
  const res = await apiFetch(`${API_BASE}/admin/users/${id}/suspend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  return parseJsonOrThrow(res, 'Failed to suspend the user');
}

export async function unsuspendUser(id) {
  const res = await apiFetch(`${API_BASE}/admin/users/${id}/unsuspend`, { method: 'POST', credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to lift the suspension');
}

export async function deleteUser(id, reason) {
  const res = await apiFetch(`${API_BASE}/admin/users/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  return parseJsonOrThrow(res, 'Failed to delete the user');
}
