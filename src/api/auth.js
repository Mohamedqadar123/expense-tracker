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

// Does not sign the person in: the account only exists once they open the
// link emailed to them. `plan` is the paid plan they picked beforehand, if any.
export async function signup(email, password, name, plan) {
  const res = await fetch(`${BASE_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, name, plan }),
  });
  return parseJsonOrThrow(res, 'Failed to sign up');
}

async function postJson(path, body, fallbackMessage) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return parseJsonOrThrow(res, fallbackMessage);
}

export function verifyEmail(token) {
  return postJson('/verify-email', { token }, 'Failed to verify email');
}

export function forgotPassword(email) {
  return postJson('/forgot-password', { email }, 'Failed to send reset link');
}

export function resetPassword(token, password) {
  return postJson('/reset-password', { token, password }, 'Failed to reset password');
}

export async function logout() {
  await fetch(`${BASE_URL}/logout`, { method: 'POST', credentials: 'include' });
}
