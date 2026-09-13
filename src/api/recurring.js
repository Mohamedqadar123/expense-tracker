import { API_BASE } from './config';

const BASE_URL = `${API_BASE}/recurring-transactions`;

export async function getRecurringTransactions() {
  const res = await fetch(BASE_URL, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load recurring transactions');
  return res.json();
}

export async function createRecurringTransaction(data) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || 'Failed to create recurring transaction');
  }
  return res.json();
}

export async function updateRecurringTransaction(id, data) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || 'Failed to update recurring transaction');
  }
  return res.json();
}

export async function deleteRecurringTransaction(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) throw new Error('Failed to delete recurring transaction');
}

export async function pauseRecurringTransaction(id) {
  const res = await fetch(`${BASE_URL}/${id}/pause`, { method: 'PATCH', credentials: 'include' });
  if (!res.ok) throw new Error('Failed to pause recurring transaction');
  return res.json();
}

export async function resumeRecurringTransaction(id) {
  const res = await fetch(`${BASE_URL}/${id}/resume`, { method: 'PATCH', credentials: 'include' });
  if (!res.ok) throw new Error('Failed to resume recurring transaction');
  return res.json();
}

export async function getRecurringTransactionHistory(id) {
  const res = await fetch(`${BASE_URL}/${id}/history`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load history');
  return res.json();
}
