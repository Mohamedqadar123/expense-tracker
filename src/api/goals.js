import { API_BASE, parseJsonOrThrow } from './config';

const BASE_URL = `${API_BASE}/goals`;

export async function getGoals() {
  const res = await fetch(BASE_URL, { credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to load savings goals');
}

export async function createGoal(data) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return parseJsonOrThrow(res, 'Failed to create savings goal');
}

export async function updateGoal(id, data) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return parseJsonOrThrow(res, 'Failed to update savings goal');
}

export async function deleteGoal(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE', credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to delete savings goal');
}
