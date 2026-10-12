import { describe, it, expect, afterEach } from 'vitest'
import i18n from '../i18n/i18n.js'
import { formatCurrency, formatSignedCurrency, formatDate } from './format'

afterEach(() => i18n.changeLanguage('en'));

describe('formatCurrency', () => {
  it('groups thousands and keeps two decimals', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });

  it('puts the minus sign before the symbol', () => {
    expect(formatCurrency(-5)).toBe('-$5.00');
  });

  it('keeps Western digits in Arabic', async () => {
    await i18n.changeLanguage('ar');
    expect(formatCurrency(1234.5)).toMatch(/1,234\.50/);
  });
});

describe('formatSignedCurrency', () => {
  it('marks income with a plus and expenses with a minus', () => {
    expect(formatSignedCurrency(50, 'income')).toBe('+$50.00');
    expect(formatSignedCurrency(50, 'expense')).toBe('-$50.00');
  });
});

describe('formatDate', () => {
  it('shows the stored calendar day whatever the time zone', () => {
    expect(formatDate('2024-01-05T00:00:00.000Z')).toBe('Jan 5, 2024');
  });
});
