import { API_BASE, parseJsonOrThrow } from './config';

const BASE_URL = `${API_BASE}/accounts`;

export async function getAccounts() {
  const res = await fetch(BASE_URL, { credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to load accounts');
}

export async function createAccount(data) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return parseJsonOrThrow(res, 'Failed to create account');
}

export async function updateAccount(id, data) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return parseJsonOrThrow(res, 'Failed to update account');
}

export async function deleteAccount(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE', credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to delete account');
}
