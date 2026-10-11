import { API_BASE, parseJsonOrThrow } from './config';

const BASE_URL = `${API_BASE}/budgets`;

export async function getBudgets() {
  const res = await fetch(BASE_URL, { credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to load budgets');
}

export async function createBudget(data) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return parseJsonOrThrow(res, 'Failed to create budget');
}

export async function updateBudget(id, data) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return parseJsonOrThrow(res, 'Failed to update budget');
}

export async function deleteBudget(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE', credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to delete budget');
}
