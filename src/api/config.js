import i18n from '../i18n/i18n.js'

// Same origin as the page by default (the dev server proxies /api to the API
// server); set VITE_API_BASE when the API lives at a different address.
export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// The server's catch-all for an error it did not expect. It says nothing a
// person can act on, so it is replaced with our own wording below.
const GENERIC_SERVER_ERROR = 'Something went wrong';

function apiError(message, details) {
  return Object.assign(new Error(message), details);
}

// `fetch`, for every call to the API. A request that never reaches the
// server (offline, server down) rejects with the browser's own "Failed to
// fetch"; here it becomes a message that says what to do about it.
export async function apiFetch(url, options) {
  try {
    return await fetch(url, options);
  } catch {
    throw apiError(i18n.t('errors.network'), { code: 'NETWORK' });
  }
}

// Shared response handler for API calls. On failure it throws an Error whose
// message is fit to show as it is, in this order of preference:
// - the session has ended (a 401 from the auth check): say so;
// - the backend's own { error } message (e.g. a specific validation reason);
// - the server failed without a useful reason: say it is our fault, try again;
// - otherwise the caller's fallback.
// The Error also carries the HTTP `status` and, for the first and third
// case, a `code` ('SESSION', 'SERVER').
export async function parseJsonOrThrow(res, fallbackMessage) {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const reason = body?.error;
    if (res.status === 401 && (!reason || reason === 'Unauthorized')) {
      throw apiError(i18n.t('errors.session'), { status: 401, code: 'SESSION' });
    }
    if (res.status >= 500 && (!reason || reason === GENERIC_SERVER_ERROR)) {
      throw apiError(i18n.t('errors.server'), { status: res.status, code: 'SERVER' });
    }
    throw apiError(reason || fallbackMessage, { status: res.status });
  }
  if (res.status === 204) return null;
  return res.json();
}

// What to show when loading something failed. A page normally uses its own
// wording ("Failed to load transactions"), but when the real cause is one
// the person can do something about, that is what they should read.
export function loadErrorMessage(error, fallbackMessage) {
  return ['NETWORK', 'SESSION', 'SERVER'].includes(error?.code) ? error.message : fallbackMessage;
}
