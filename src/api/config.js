export const API_BASE = 'http://localhost:3001/api';

// Shared response handler for API calls: on failure, prefers the backend's
// own JSON { error } message (e.g. a specific validation reason) over a
// generic fallback, so the UI can surface what actually went wrong.
export async function parseJsonOrThrow(res, fallbackMessage) {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || fallbackMessage);
  }
  if (res.status === 204) return null;
  return res.json();
}
