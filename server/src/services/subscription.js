export const TRIAL_DAYS = 7;
export const PERIOD_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

// Standard is the whole app except Finance AI; Pro adds Finance AI.
export const PLAN_IDS = ['standard', 'pro'];

export function getPlans() {
  return {
    currency: process.env.PLAN_CURRENCY || 'USD',
    periodDays: PERIOD_DAYS,
    trialDays: TRIAL_DAYS,
    plans: [
      { id: 'standard', price: Number(process.env.STANDARD_PRICE) || 5, financeAI: false },
      { id: 'pro', price: Number(process.env.PRO_PRICE) || 10, financeAI: true },
    ],
  };
}

export function newTrialEnd(now = new Date()) {
  return new Date(now.getTime() + TRIAL_DAYS * DAY_MS);
}

// plan is what the account is on right now: a paid plan while one is active,
// otherwise "trial", otherwise "expired". The trial includes every feature,
// so Finance AI stays available for the rest of the trial even to someone
// who has already paid for Standard.
export function getAccess(user, now = new Date()) {
  const trialEndsAt = user.trialEndsAt || null;
  const paidUntil = user.paidUntil || null;
  const inTrial = Boolean(trialEndsAt && trialEndsAt > now);
  const paidPlan = paidUntil && paidUntil > now && PLAN_IDS.includes(user.paidPlan) ? user.paidPlan : null;

  return {
    plan: paidPlan || (inTrial ? 'trial' : 'expired'),
    hasAccess: Boolean(paidPlan) || inTrial,
    hasFinanceAI: paidPlan === 'pro' || inTrial,
    // Unsubscribed, but still inside the period they paid for.
    cancelled: Boolean(paidPlan && user.cancelledAt),
    trialEndsAt,
    paidUntil,
  };
}

// Renewing the same plan adds a period on top of the time already paid for.
// Switching plans starts the new plan immediately instead, since days bought
// at one price can't be carried over at another. Either way the new period
// never starts before the trial ends, so paying early doesn't cost trial days.
export function extendPaidUntil(user, plan, now = new Date()) {
  const samePlanUntil = user.paidPlan === plan && user.paidUntil ? user.paidUntil.getTime() : 0;
  const base = Math.max(now.getTime(), samePlanUntil, user.trialEndsAt ? user.trialEndsAt.getTime() : 0);
  return new Date(base + PERIOD_DAYS * DAY_MS);
}
