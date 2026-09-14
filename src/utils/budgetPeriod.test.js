import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { computePeriodDates } from './budgetPeriod.js';

// June 15, 2024 is a Saturday.
const SATURDAY = new Date(2024, 5, 15, 12, 0, 0);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(SATURDAY);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('computePeriodDates', () => {
  it('weekly: Monday through Sunday of the current week', () => {
    expect(computePeriodDates('weekly')).toEqual({ start: '2024-06-10', end: '2024-06-16' });
  });

  it('monthly: first through last day of the current month', () => {
    expect(computePeriodDates('monthly')).toEqual({ start: '2024-06-01', end: '2024-06-30' });
  });

  it('yearly: Jan 1 through Dec 31 of the current year', () => {
    expect(computePeriodDates('yearly')).toEqual({ start: '2024-01-01', end: '2024-12-31' });
  });

  it('returns null for an unrecognized period', () => {
    expect(computePeriodDates('custom')).toBeNull();
  });
});
