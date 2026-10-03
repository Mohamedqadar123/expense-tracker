import { API_BASE, parseJsonOrThrow } from './config';

const BASE_URL = `${API_BASE}/auth`;

export async function getMe() {
  const res = await fetch(`${BASE_URL}/me`, { credentials: 'include' });
  return parseJsonOrThrow(res, 'Not authenticated');
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
