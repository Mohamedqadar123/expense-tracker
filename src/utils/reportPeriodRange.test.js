import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getReportPeriodRange } from './reportPeriodRange.js';

// June 15, 2024 is a Saturday.
const SATURDAY = new Date(2024, 5, 15, 12, 0, 0);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(SATURDAY);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getReportPeriodRange', () => {
  it('today', () => {
    expect(getReportPeriodRange('today')).toEqual({ start: '2024-06-15', end: '2024-06-15' });
  });

  it('week', () => {
    expect(getReportPeriodRange('week')).toEqual({ start: '2024-06-10', end: '2024-06-15' });
  });

  it('month', () => {
    expect(getReportPeriodRange('month')).toEqual({ start: '2024-06-01', end: '2024-06-15' });
  });

  it('lastMonth spans the entirety of the previous calendar month', () => {
    expect(getReportPeriodRange('lastMonth')).toEqual({ start: '2024-05-01', end: '2024-05-31' });
  });

  it('year', () => {
    expect(getReportPeriodRange('year')).toEqual({ start: '2024-01-01', end: '2024-06-15' });
  });

  it('custom falls back to today when no dates are given', () => {
    expect(getReportPeriodRange('custom')).toEqual({ start: '2024-06-15', end: '2024-06-15' });
  });
});
