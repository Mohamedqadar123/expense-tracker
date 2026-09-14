import { vi } from 'vitest';

function resolveOkStatus({ ok, status }) {
  const resolvedStatus = status ?? (ok === false ? 400 : 200);
  const resolvedOk = ok ?? resolvedStatus < 400;
  return { ok: resolvedOk, status: resolvedStatus };
}

export function mockFetchOnce(body, opts = {}) {
  const { ok, status } = resolveOkStatus(opts);
  const fn = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

export function mockFetchSequence(responses) {
  const fn = vi.fn();
  responses.forEach(({ body, ...opts }) => {
    const { ok, status } = resolveOkStatus(opts);
    fn.mockResolvedValueOnce({ ok, status, json: async () => body });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}
