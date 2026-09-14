import '@testing-library/jest-dom/vitest';
import '../i18n/i18n.js';
import { afterEach, beforeEach, vi } from 'vitest';

// Re-defined before every test (not just once at module load) because
// vi.restoreAllMocks() in the afterEach below strips the mock implementation
// off this vi.fn() after each test, which would leave window.matchMedia
// returning undefined for every test after the first.
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
