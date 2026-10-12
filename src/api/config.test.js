import { describe, it, expect, vi } from 'vitest'
import { apiFetch, parseJsonOrThrow, loadErrorMessage } from './config'

function response(status, body) {
  return {
    ok: status < 400,
    status,
    json: body === undefined ? async () => { throw new SyntaxError('Unexpected token <'); } : async () => body,
  };
}

async function failure(status, body, fallback = 'Failed to load transactions') {
  return parseJsonOrThrow(response(status, body), fallback).then(
    () => { throw new Error('expected a rejection'); },
    (error) => error,
  );
}

describe('apiFetch', () => {
  it('passes a response straight through', async () => {
    const res = response(200, { ok: true });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res));
    await expect(apiFetch('/api/x', { method: 'POST' })).resolves.toBe(res);
    expect(fetch).toHaveBeenCalledWith('/api/x', { method: 'POST' });
  });

  it('turns a request that never reached the server into advice, not "Failed to fetch"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const error = await apiFetch('/api/x').catch((e) => e);
    expect(error.message).toBe("Can't reach the server. Check your internet connection and try again.");
    expect(error.code).toBe('NETWORK');
  });
});

describe('parseJsonOrThrow', () => {
  it('returns the body of a successful response, and null for 204', async () => {
    await expect(parseJsonOrThrow(response(200, { id: 1 }), 'x')).resolves.toEqual({ id: 1 });
    await expect(parseJsonOrThrow(response(204), 'x')).resolves.toBeNull();
  });

  it('prefers the reason the backend gave', async () => {
    const error = await failure(400, { error: '"Bank" only has $20.00 available.' });
    expect(error.message).toBe('"Bank" only has $20.00 available.');
    expect(error.status).toBe(400);
  });

  it('falls back to the caller\'s wording when the backend gave no reason', async () => {
    expect((await failure(404, {})).message).toBe('Failed to load transactions');
  });

  it('says the session has ended when the auth check refuses the request', async () => {
    const error = await failure(401, { error: 'Unauthorized' });
    expect(error.message).toBe('Your session has ended. Please log in again.');
    expect(error.code).toBe('SESSION');
  });

  it('keeps a specific 401 reason, such as a wrong password', async () => {
    expect((await failure(401, { error: 'Invalid email or password' })).message).toBe('Invalid email or password');
  });

  it('never shows a server failure\'s raw page or generic text', async () => {
    const withHtmlPage = await failure(502);
    const generic = await failure(500, { error: 'Something went wrong' });
    for (const error of [withHtmlPage, generic]) {
      expect(error.message).toBe('Something went wrong on our side. Please try again in a moment.');
      expect(error.code).toBe('SERVER');
    }
  });

  it('keeps a specific reason from a 500', async () => {
    expect((await failure(500, { error: 'Failed to load dashboard data' })).message).toBe('Failed to load dashboard data');
  });
});

describe('loadErrorMessage', () => {
  it('shows the cause when it is one the person can act on, otherwise the page\'s own wording', () => {
    const offline = Object.assign(new Error('offline advice'), { code: 'NETWORK' });
    expect(loadErrorMessage(offline, 'Failed to load accounts')).toBe('offline advice');
    expect(loadErrorMessage(new Error('boom'), 'Failed to load accounts')).toBe('Failed to load accounts');
    expect(loadErrorMessage(undefined, 'Failed to load accounts')).toBe('Failed to load accounts');
  });
});
