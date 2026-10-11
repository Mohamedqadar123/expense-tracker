import { API_BASE, parseJsonOrThrow } from './config';

const BASE_URL = `${API_BASE}/ai`;

export async function getAiMessages() {
  const res = await fetch(`${BASE_URL}/messages`, { credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to load conversation history');
}

export async function askAiQuestion(question) {
  const res = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ question }),
  });
  return parseJsonOrThrow(res, 'Failed to get a response');
}

export async function clearAiMessages() {
  const res = await fetch(`${BASE_URL}/messages`, { method: 'DELETE', credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to clear history');
}
