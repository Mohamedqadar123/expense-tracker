import { API_BASE } from './config';

const BASE_URL = `${API_BASE}/budgets`;

export async function getBudgets() {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error('Failed to load budgets');
  return res.json();
}

export async function createBudget(data) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create budget');
  return res.json();
}

export async function updateBudget(id, data) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update budget');
  return res.json();
}

export async function deleteBudget(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete budget');
}
