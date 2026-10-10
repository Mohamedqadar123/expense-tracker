// Same origin as the page by default (the dev server proxies /api to the API
// server); set VITE_API_BASE when the API lives at a different address.
export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

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
