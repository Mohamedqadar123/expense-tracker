import { API_BASE } from './config';

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
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function getTransactionAccounts() {
  const res = await fetch(`${BASE_URL}/accounts`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return res.json();
}

export async function createTransaction(data) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create transaction');
  return res.json();
}

export async function deleteTransaction(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) throw new Error('Failed to delete transaction');
}
