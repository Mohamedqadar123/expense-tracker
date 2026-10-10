import { describe, it, expect } from 'vitest';
import { getUsername, isNewUser } from './username';

describe('getUsername', () => {
  it.each([
    ['mohamedqadar1918@gmail.com', 'mohamedqadar'],
    ['moha.qadar_99+shop@yahoo.com', 'mohaqadarshop'],
    ['Sara-Ali@company.so', 'SaraAli'],
    ['محمد2024@outlook.com', 'محمد'],
    ['12345@gmail.com', ''],
    [undefined, ''],
  ])('turns %s into "%s"', (email, expected) => {
    expect(getUsername(email)).toBe(expected);
  });
});

describe('isNewUser', () => {
  const now = new Date('2026-10-07T12:00:00Z').getTime();

  it('is true within 24 hours of registering', () => {
    expect(isNewUser('2026-10-06T12:00:01Z', now)).toBe(true);
  });

  it('is false once 24 hours have passed', () => {
    expect(isNewUser('2026-10-06T12:00:00Z', now)).toBe(false);
  });

  it('is false when the registration date is unknown', () => {
    expect(isNewUser(undefined, now)).toBe(false);
  });
});
