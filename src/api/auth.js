import { API_BASE } from './config';

const BASE_URL = `${API_BASE}/auth`;

async function parseJsonOrThrow(res, fallbackMessage) {
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || fallbackMessage);
  return data;
}

export async function getMe() {
  const res = await fetch(`${BASE_URL}/me`, { credentials: 'include' });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  return parseJsonOrThrow(res, 'Failed to log in');
}

export async function signup(email, password, name) {
  const res = await fetch(`${BASE_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, name }),
  });
  return parseJsonOrThrow(res, 'Failed to sign up');
}

export async function logout() {
  await fetch(`${BASE_URL}/logout`, { method: 'POST', credentials: 'include' });
}
