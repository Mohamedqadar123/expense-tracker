import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import prisma from '../prismaClient.js';
import requireAuth from '../middleware/requireAuth.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { createRateLimitStore } from '../rateLimitStore.js';
import { getAccess, getPlans, extendPaidUntil } from '../services/subscription.js';
import { chargeWallet, isPaymentConfigured, normalizeSomaliPhone } from '../services/waafiPayClient.js';

const router = Router();

const PROVIDER = 'waafipay';
// A charge stays "pending" while the customer is being prompted for their
// PIN; a second attempt in that window would prompt (and could bill) twice.
const PENDING_WINDOW_MS = 3 * 60 * 1000;

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  keyGenerator: (req) => String(req.user.id),
  store: createRateLimitStore('pay:'),
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many payment attempts. Please wait a few minutes and try again.' });
  },
});

// Public: the landing page shows the price before anyone has an account.
router.get('/plans', (req, res) => {
  res.json(getPlans());
});

router.get('/status', requireAuth, asyncHandler(async (req, res) => {
  const [user, payments] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.user.id } }),
    prisma.payment.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, plan: true, amount: true, currency: true, status: true, phone: true, createdAt: true },
    }),
  ]);
  res.json({
    access: getAccess(user),
    pricing: getPlans(),
    paymentsEnabled: isPaymentConfigured(),
    payments,
  });
}));

router.post('/subscribe', requireAuth, paymentLimiter, asyncHandler(async (req, res) => {
  if (!isPaymentConfigured()) {
    return res.status(503).json({ error: 'Payments are not set up yet. Please try again later.' });
  }

  const { currency, plans } = getPlans();
  const plan = plans.find((p) => p.id === req.body.plan);
  if (!plan) {
    return res.status(400).json({ error: 'Choose the Standard or Pro plan' });
  }

  const phone = normalizeSomaliPhone(req.body.phone);
  if (!phone) {
    return res.status(400).json({ error: 'Enter a valid Somali mobile number, e.g. 61 5551234' });
  }

  const pending = await prisma.payment.findFirst({
    where: { userId: req.user.id, status: 'pending', createdAt: { gt: new Date(Date.now() - PENDING_WINDOW_MS) } },
  });
  if (pending) {
    return res.status(409).json({ error: 'A payment is already in progress. Check your phone to approve it.' });
  }

  const payment = await prisma.payment.create({
    data: {
      userId: req.user.id,
      provider: PROVIDER,
      plan: plan.id,
      referenceId: randomUUID(),
      phone,
      amount: plan.price,
      currency,
    },
  });

  let result;
  try {
    result = await chargeWallet({
      phone,
      amount: plan.price,
      currency,
      referenceId: payment.referenceId,
      description: `Finance Tracker ${plan.id} plan`,
    });
  } catch (err) {
    // We never got an answer, so the charge may or may not have gone through.
    // Recorded as "unknown" (not "failed") so it can be reconciled by hand.
    console.error(err);
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'unknown', message: err.message } });
    return res.status(502).json({
      error: 'We could not confirm your payment. If money left your wallet, contact support before trying again.',
    });
  }

  if (!result.approved) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed', message: result.message } });
    return res.status(402).json({ error: 'Payment was not completed and nothing was charged. Please try again.' });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const [, updated] = await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'approved', providerTransactionId: result.transactionId, message: result.message },
    }),
    prisma.user.update({
      where: { id: user.id },
      // Paying again is a fresh decision to subscribe, so it undoes an
      // earlier unsubscribe.
      data: { paidPlan: plan.id, paidUntil: extendPaidUntil(user, plan.id), cancelledAt: null },
    }),
  ]);

  res.json({ access: getAccess(updated) });
}));

// Plans are prepaid and never renew by themselves, so unsubscribing takes
// nothing away: the user keeps the days they paid for (there is no refund to
// give back) and the plan simply ends on paidUntil. What this records is
// their decision, which the app then shows instead of prompting to renew.
router.post('/unsubscribe', requireAuth, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const access = getAccess(user);
  if (access.plan !== 'standard' && access.plan !== 'pro') {
    return res.status(400).json({ error: "You don't have a paid plan to unsubscribe from." });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { cancelledAt: user.cancelledAt || new Date() },
  });
  res.json({ access: getAccess(updated) });
}));

// Undoes an unsubscribe while the paid period is still running.
router.post('/resubscribe', requireAuth, asyncHandler(async (req, res) => {
  const updated = await prisma.user.update({ where: { id: req.user.id }, data: { cancelledAt: null } });
  res.json({ access: getAccess(updated) });
}));

export default router;
