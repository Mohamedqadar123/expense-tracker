import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getPeriodRange } from './periodRange.js';

// June 15, 2024 is a Saturday. Constructed via local date components and read
// back via local getters inside periodRange.js, so this is timezone-agnostic.
const SATURDAY = new Date(2024, 5, 15, 12, 0, 0);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(SATURDAY);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getPeriodRange', () => {
  it('today: start and end are both today', () => {
    expect(getPeriodRange('today')).toEqual({ start: '2024-06-15', end: '2024-06-15' });
  });

  it('week: start is the most recent Monday', () => {
    expect(getPeriodRange('week')).toEqual({ start: '2024-06-10', end: '2024-06-15' });
  });

  it('month: start is the first of the current month', () => {
    expect(getPeriodRange('month')).toEqual({ start: '2024-06-01', end: '2024-06-15' });
  });

  it('year: start is the first of the current year', () => {
    expect(getPeriodRange('year')).toEqual({ start: '2024-01-01', end: '2024-06-15' });
  });

  it('custom: uses the provided custom start/end, falling back to today', () => {
    expect(getPeriodRange('custom', '2024-01-01', '2024-01-31')).toEqual({ start: '2024-01-01', end: '2024-01-31' });
    expect(getPeriodRange('custom')).toEqual({ start: '2024-06-15', end: '2024-06-15' });
  });
});
