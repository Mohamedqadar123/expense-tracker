import { API_BASE, parseJsonOrThrow } from './config';

const BASE_URL = `${API_BASE}/billing`;

export async function getPlans() {
  const res = await fetch(`${BASE_URL}/plans`);
  return parseJsonOrThrow(res, 'Failed to load pricing');
}

export async function getBillingStatus() {
  const res = await fetch(`${BASE_URL}/status`, { credentials: 'include' });
  return parseJsonOrThrow(res, 'Failed to load subscription');
}

async function post(path, fallbackMessage) {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', credentials: 'include' });
  return parseJsonOrThrow(res, fallbackMessage);
}

// Ends the paid plan at the end of the period already paid for.
export function unsubscribe() {
  return post('/unsubscribe', 'Failed to unsubscribe');
}

// Undoes an unsubscribe while the paid period is still running.
export function resubscribe() {
  return post('/resubscribe', 'Failed to keep your plan');
}

// Resolves only after the customer approves (or rejects) the charge on their
// phone, so this request can stay open for a couple of minutes.
export async function subscribe(plan, phone) {
  const res = await fetch(`${BASE_URL}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ plan, phone }),
  });
  return parseJsonOrThrow(res, 'Payment failed');
}
