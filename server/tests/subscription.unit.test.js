import { describe, it, expect } from 'vitest';
import { getAccess, extendPaidUntil, getPlans, PERIOD_DAYS } from '../src/services/subscription.js';
import { normalizeSomaliPhone } from '../src/services/waafiPayClient.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const now = new Date('2026-10-06T12:00:00Z');
const daysFromNow = (days) => new Date(now.getTime() + days * DAY_MS);

describe('getPlans', () => {
  it('prices Standard at 5 and Pro at 10 by default, with Finance AI only in Pro', () => {
    expect(getPlans().plans).toEqual([
      { id: 'standard', price: 5, financeAI: false },
      { id: 'pro', price: 10, financeAI: true },
    ]);
  });
});

describe('getAccess', () => {
  it('gives the trial every feature, including Finance AI', () => {
    const access = getAccess({ trialEndsAt: daysFromNow(3), paidPlan: null, paidUntil: null }, now);
    expect(access).toMatchObject({ plan: 'trial', hasAccess: true, hasFinanceAI: true });
  });

  it('locks the account once the trial has ended and nothing is paid', () => {
    const access = getAccess({ trialEndsAt: daysFromNow(-1), paidPlan: null, paidUntil: null }, now);
    expect(access).toMatchObject({ plan: 'expired', hasAccess: false, hasFinanceAI: false });
  });

  it('gives Standard the app but not Finance AI', () => {
    const access = getAccess({ trialEndsAt: daysFromNow(-9), paidPlan: 'standard', paidUntil: daysFromNow(20) }, now);
    expect(access).toMatchObject({ plan: 'standard', hasAccess: true, hasFinanceAI: false });
  });

  it('gives Pro the app and Finance AI', () => {
    const access = getAccess({ trialEndsAt: daysFromNow(-9), paidPlan: 'pro', paidUntil: daysFromNow(20) }, now);
    expect(access).toMatchObject({ plan: 'pro', hasAccess: true, hasFinanceAI: true });
  });

  it('keeps Finance AI for the rest of the trial after paying for Standard', () => {
    const access = getAccess({ trialEndsAt: daysFromNow(3), paidPlan: 'standard', paidUntil: daysFromNow(33) }, now);
    expect(access).toMatchObject({ plan: 'standard', hasFinanceAI: true });
  });

  it('locks the account once the paid period has lapsed', () => {
    const access = getAccess({ trialEndsAt: daysFromNow(-40), paidPlan: 'pro', paidUntil: daysFromNow(-1) }, now);
    expect(access).toMatchObject({ plan: 'expired', hasAccess: false, hasFinanceAI: false });
  });

  it('reports an unsubscribed plan as cancelled while it is still running', () => {
    const user = { trialEndsAt: daysFromNow(-9), paidPlan: 'pro', paidUntil: daysFromNow(5), cancelledAt: daysFromNow(-1) };
    expect(getAccess(user, now)).toMatchObject({ plan: 'pro', hasAccess: true, cancelled: true });
  });

  it('does not report cancelled once the plan has ended, or when it never was', () => {
    const ended = { trialEndsAt: daysFromNow(-40), paidPlan: 'pro', paidUntil: daysFromNow(-1), cancelledAt: daysFromNow(-5) };
    expect(getAccess(ended, now)).toMatchObject({ plan: 'expired', cancelled: false });
    const active = { trialEndsAt: daysFromNow(-9), paidPlan: 'pro', paidUntil: daysFromNow(5), cancelledAt: null };
    expect(getAccess(active, now).cancelled).toBe(false);
  });

  it('locks an account with no trial or payment', () => {
    expect(getAccess({ trialEndsAt: null, paidPlan: null, paidUntil: null }, now).hasAccess).toBe(false);
  });
});

describe('extendPaidUntil', () => {
  it('starts a lapsed user from today', () => {
    const user = { trialEndsAt: daysFromNow(-10), paidPlan: 'pro', paidUntil: daysFromNow(-2) };
    expect(extendPaidUntil(user, 'pro', now)).toEqual(daysFromNow(PERIOD_DAYS));
  });

  it('adds the new period after the remaining trial days', () => {
    const user = { trialEndsAt: daysFromNow(4), paidPlan: null, paidUntil: null };
    expect(extendPaidUntil(user, 'standard', now)).toEqual(daysFromNow(4 + PERIOD_DAYS));
  });

  it('stacks a renewal of the same plan on the time already paid for', () => {
    const user = { trialEndsAt: daysFromNow(-30), paidPlan: 'pro', paidUntil: daysFromNow(12) };
    expect(extendPaidUntil(user, 'pro', now)).toEqual(daysFromNow(12 + PERIOD_DAYS));
  });

  it('starts a different plan from today instead of carrying days over', () => {
    const user = { trialEndsAt: daysFromNow(-30), paidPlan: 'standard', paidUntil: daysFromNow(12) };
    expect(extendPaidUntil(user, 'pro', now)).toEqual(daysFromNow(PERIOD_DAYS));
  });
});

describe('normalizeSomaliPhone', () => {
  it.each([
    ['615551234', '252615551234'],
    ['0615551234', '252615551234'],
    ['61 555 1234', '252615551234'],
    ['+252 61 5551234', '252615551234'],
    ['00252615551234', '252615551234'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeSomaliPhone(input)).toBe(expected);
  });

  it.each(['', '12345', '61555123456', 'not a number', undefined])('rejects %s', (input) => {
    expect(normalizeSomaliPhone(input)).toBeNull();
  });
});
