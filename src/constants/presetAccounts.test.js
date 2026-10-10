import { describe, it, expect } from 'vitest';
import { PRESET_ACCOUNTS, getUnusedPresetAccounts } from './presetAccounts';

describe('getUnusedPresetAccounts', () => {
  it('offers every preset to a user who only has the default account', () => {
    expect(getUnusedPresetAccounts([{ name: 'Cash' }])).toEqual(PRESET_ACCOUNTS);
  });

  it('leaves out presets the user already has, ignoring case', () => {
    const unused = getUnusedPresetAccounts([{ name: 'salam bank' }, { name: 'EVC PLUS' }]);
    expect(unused).not.toContain('Salam Bank');
    expect(unused).not.toContain('EVC Plus');
    expect(unused).toContain('Premier Bank');
    expect(unused).toHaveLength(PRESET_ACCOUNTS.length - 2);
  });
});
