import { describe, it, expect } from 'vitest';
import { mergeCategories } from './mergeCategories.js';

describe('mergeCategories', () => {
  it('combines two lists with no overlap', () => {
    expect(mergeCategories(['Food'], ['Rent'])).toEqual(['Food', 'Rent']);
  });

  it('dedupes case-insensitively, keeping the first-seen casing', () => {
    expect(mergeCategories(['Food'], ['food', 'Rent'])).toEqual(['Food', 'Rent']);
  });

  it('handles empty lists', () => {
    expect(mergeCategories([], [])).toEqual([]);
    expect(mergeCategories(['Food'], [])).toEqual(['Food']);
  });
});
