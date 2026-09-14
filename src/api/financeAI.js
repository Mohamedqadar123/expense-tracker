import { API_BASE } from './config';

const BASE_URL = `${API_BASE}/ai`;

export async function getAiMessages() {
  const res = await fetch(`${BASE_URL}/messages`, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || 'Failed to load conversation history');
  }
  return res.json();
}

export async function askAiQuestion(question) {
  const res = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || 'Failed to get a response');
  }
  return res.json();
}

export async function clearAiMessages() {
  const res = await fetch(`${BASE_URL}/messages`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || 'Failed to clear history');
  }
}
