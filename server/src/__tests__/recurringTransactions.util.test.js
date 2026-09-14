import { describe, it, expect } from 'vitest';
import { computeNextOccurrence } from '../utils/recurringTransactions.js';

describe('computeNextOccurrence', () => {
  it('advances daily by exactly one day', () => {
    const start = new Date('2024-01-01T09:30:00.000Z');
    const next = computeNextOccurrence(start, 'daily', start);
    expect(next.toISOString()).toBe('2024-01-02T09:30:00.000Z');
  });

  it('advances weekly by exactly seven days', () => {
    const start = new Date('2024-01-01T09:30:00.000Z');
    const next = computeNextOccurrence(start, 'weekly', start);
    expect(next.toISOString()).toBe('2024-01-08T09:30:00.000Z');
  });

  it('advances monthly, keeping the anchor day, on a non-edge day', () => {
    const start = new Date('2024-01-15T00:00:00.000Z');
    const next = computeNextOccurrence(start, 'monthly', start);
    expect(next.toISOString()).toBe('2024-02-15T00:00:00.000Z');
  });

  it('clamps month-end and then recovers to the anchor day (Jan 31 -> Feb 29 -> Mar 31, leap year)', () => {
    const start = new Date('2024-01-31T00:00:00.000Z');
    const feb = computeNextOccurrence(start, 'monthly', start);
    expect(feb.toISOString()).toBe('2024-02-29T00:00:00.000Z');
    const mar = computeNextOccurrence(feb, 'monthly', start);
    expect(mar.toISOString()).toBe('2024-03-31T00:00:00.000Z');
  });

  it('clamps month-end in a non-leap year (Jan 31 -> Feb 28 -> Mar 31)', () => {
    const start = new Date('2023-01-31T00:00:00.000Z');
    const feb = computeNextOccurrence(start, 'monthly', start);
    expect(feb.toISOString()).toBe('2023-02-28T00:00:00.000Z');
    const mar = computeNextOccurrence(feb, 'monthly', start);
    expect(mar.toISOString()).toBe('2023-03-31T00:00:00.000Z');
  });

  it('advances yearly on an ordinary anchor date', () => {
    const start = new Date('2024-03-15T00:00:00.000Z');
    const next = computeNextOccurrence(start, 'yearly', start);
    expect(next.toISOString()).toBe('2025-03-15T00:00:00.000Z');
  });

  it('clamps a leap-day (Feb 29) anchor to Feb 28 in a non-leap year', () => {
    const start = new Date('2024-02-29T00:00:00.000Z');
    const next = computeNextOccurrence(start, 'yearly', start);
    expect(next.toISOString()).toBe('2025-02-28T00:00:00.000Z');
  });

  it('throws on an unsupported frequency', () => {
    const start = new Date('2024-01-01T00:00:00.000Z');
    expect(() => computeNextOccurrence(start, 'hourly', start)).toThrow('Unsupported frequency');
  });

  it('preserves the anchor time-of-day across all frequencies', () => {
    const start = new Date('2024-01-15T14:45:30.500Z');
    expect(computeNextOccurrence(start, 'daily', start).toISOString()).toBe('2024-01-16T14:45:30.500Z');
    expect(computeNextOccurrence(start, 'weekly', start).toISOString()).toBe('2024-01-22T14:45:30.500Z');
    expect(computeNextOccurrence(start, 'monthly', start).toISOString()).toBe('2024-02-15T14:45:30.500Z');
    expect(computeNextOccurrence(start, 'yearly', start).toISOString()).toBe('2025-01-15T14:45:30.500Z');
  });
});
