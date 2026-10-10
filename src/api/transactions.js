import { API_BASE, parseJsonOrThrow } from './config';

const BASE_URL = `${API_BASE}/transactions`;

export async function getTransactions(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value);
    }
  });
  const qs = searchParams.toString();
  const res = await fetch(`${BASE_URL}${qs ? `?${qs}` : ''}`, { credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to fetch transactions');
}

export async function getTransactionAccounts() {
  const res = await fetch(`${BASE_URL}/accounts`, { credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to fetch accounts');
}

export async function createTransaction(data) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return parseJsonOrThrow(res, 'Failed to create transaction');
}

export async function updateTransaction(id, data) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return parseJsonOrThrow(res, 'Failed to update transaction');
}

export async function deleteTransaction(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE', credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to delete transaction');
}
