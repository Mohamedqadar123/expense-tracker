import { describe, it, expect } from 'vitest'
import { getAccountType } from './accountType'
import { PRESET_ACCOUNTS } from '../constants/presetAccounts'

describe('getAccountType', () => {
  it('reads banks, mobile money and cash from the name, whatever its case', () => {
    expect(getAccountType('Salam Bank')).toBe('bank');
    expect(getAccountType('my bank')).toBe('bank');
    expect(getAccountType('EVC Plus')).toBe('mobileMoney');
    expect(getAccountType('zaad')).toBe('mobileMoney');
    expect(getAccountType('Cash')).toBe('cash');
  });

  it('calls anything it cannot place "other" rather than guessing', () => {
    expect(getAccountType('Savings jar')).toBe('other');
    expect(getAccountType('')).toBe('other');
    expect(getAccountType(undefined)).toBe('other');
  });

  it('places every preset account the app offers', () => {
    PRESET_ACCOUNTS.forEach((name) => expect(getAccountType(name)).not.toBe('other'));
  });
});
