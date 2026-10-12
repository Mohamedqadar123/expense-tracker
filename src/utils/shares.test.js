import { describe, it, expect } from 'vitest'
import { toWholePercents, formatShare } from './shares'

describe('toWholePercents', () => {
  it('adds up to 100 where rounding each share on its own would give 99', () => {
    // Three equal thirds: 33.3% each rounds to 33 + 33 + 33
    const percents = toWholePercents([100, 100, 100]);
    expect(percents.reduce((sum, p) => sum + p, 0)).toBe(100);
    expect(percents).toEqual([34, 33, 33]);
  });

  it('adds up to 100 where rounding each share on its own would give 101', () => {
    // 16.67% x 6 would round to 17 x 6 = 102
    const percents = toWholePercents([1, 1, 1, 1, 1, 1]);
    expect(percents.reduce((sum, p) => sum + p, 0)).toBe(100);
  });

  it('gives a single amount the whole 100', () => {
    expect(toWholePercents([42.5])).toEqual([100]);
  });

  it('keeps exact shares exact', () => {
    expect(toWholePercents([150, 50])).toEqual([75, 25]);
  });

  it('returns zeros when there is nothing to share out', () => {
    expect(toWholePercents([])).toEqual([]);
    expect(toWholePercents([0, 0])).toEqual([0, 0]);
  });
});

describe('formatShare', () => {
  it('shows a real but tiny share as less than one percent, not zero', () => {
    const amounts = [999, 1];
    const percents = toWholePercents(amounts);
    expect(percents).toEqual([100, 0]);
    expect(formatShare(percents[1], amounts[1])).toBe('<1%');
    expect(formatShare(percents[0], amounts[0])).toBe('100%');
  });
});
