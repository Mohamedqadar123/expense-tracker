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
