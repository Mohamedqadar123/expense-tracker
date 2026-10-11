import { API_BASE, parseJsonOrThrow } from './config';

const BASE_URL = `${API_BASE}/recurring-transactions`;

export async function getRecurringTransactions() {
  const res = await fetch(BASE_URL, { credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to load recurring transactions');
}

export async function createRecurringTransaction(data) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return parseJsonOrThrow(res, 'Failed to create recurring transaction');
}

export async function updateRecurringTransaction(id, data) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return parseJsonOrThrow(res, 'Failed to update recurring transaction');
}

export async function deleteRecurringTransaction(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE', credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to delete recurring transaction');
}

export async function pauseRecurringTransaction(id) {
  const res = await fetch(`${BASE_URL}/${id}/pause`, { method: 'PATCH', credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to pause recurring transaction');
}

export async function resumeRecurringTransaction(id) {
  const res = await fetch(`${BASE_URL}/${id}/resume`, { method: 'PATCH', credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to resume recurring transaction');
}

export async function getRecurringTransactionHistory(id) {
  const res = await fetch(`${BASE_URL}/${id}/history`, { credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to load history');
}
