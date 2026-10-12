import { Router } from 'express';
import prisma from '../prismaClient.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { getAccess } from '../services/subscription.js';
import { isAdmin } from '../utils/admin.js';
import { MODERATION_REASONS } from '../constants/moderation.js';

const router = Router();

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_USERS = 1000;
const MAX_PAYMENTS = 200;

// Whole days of access left, rounded up so "ends later today" reads as 1.
function daysLeft(endsAt, now) {
  if (!endsAt || endsAt <= now) return 0;
  return Math.ceil((endsAt.getTime() - now.getTime()) / DAY_MS);
}

router.get('/overview', asyncHandler(async (req, res) => {
  const now = new Date();

  const [users, payments, paidTotals, userCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: MAX_USERS,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        emailVerifiedAt: true,
        trialEndsAt: true,
        paidPlan: true,
        paidUntil: true,
        cancelledAt: true,
        suspendedAt: true,
        suspensionReason: true,
      },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: MAX_PAYMENTS,
      select: {
        id: true,
        plan: true,
        amount: true,
        currency: true,
        status: true,
        phone: true,
        createdAt: true,
        user: { select: { email: true, name: true } },
      },
    }),
    prisma.payment.groupBy({
      by: ['userId'],
      where: { status: 'approved' },
      _sum: { amount: true },
    }),
    prisma.user.count(),
  ]);

  const paidByUser = new Map(paidTotals.map((row) => [row.userId, row._sum.amount || 0]));
  const planCounts = { trial: 0, standard: 0, pro: 0, expired: 0 };

  const userRows = users.map((user) => {
    const access = getAccess(user, now);
    planCounts[access.plan] += 1;
    // What the account is running on right now: the paid period if there is
    // one, otherwise the trial.
    const accessEndsAt = access.plan === 'trial' ? access.trialEndsAt : access.paidUntil || access.trialEndsAt;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      registeredAt: user.createdAt,
      emailVerified: Boolean(user.emailVerifiedAt),
      plan: access.plan,
      cancelled: access.cancelled,
      accessEndsAt,
      daysLeft: daysLeft(accessEndsAt, now),
      totalPaid: paidByUser.get(user.id) || 0,
      isAdmin: isAdmin(user),
      suspendedAt: user.suspendedAt,
      suspensionReason: user.suspensionReason,
    };
  });

  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
  const [newUsersLast7Days, revenueAll, revenueLast30Days] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.payment.aggregate({ where: { status: 'approved' }, _sum: { amount: true }, _count: true }),
    prisma.payment.aggregate({
      where: { status: 'approved', createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    }),
  ]);

  res.json({
    stats: {
      totalUsers: userCount,
      newUsersLast7Days,
      planCounts,
      approvedPayments: revenueAll._count,
      revenueTotal: revenueAll._sum.amount || 0,
      revenueLast30Days: revenueLast30Days._sum.amount || 0,
      currency: process.env.PLAN_CURRENCY || 'USD',
    },
    users: userRows,
    payments: payments.map(({ user, ...payment }) => ({
      ...payment,
      userEmail: user.email,
      userName: user.name,
    })),
  });
}));

// Finds the account an admin wants to act on, or answers with why they can't.
// Admins can't suspend or delete themselves or each other: that is done by
// editing ADMIN_EMAILS, not from the dashboard.
async function findModeratableUser(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid user id' });
    return null;
  }
  if (id === req.user.id) {
    res.status(400).json({ error: 'You cannot suspend or delete your own account' });
    return null;
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return null;
  }
  if (isAdmin(user)) {
    res.status(400).json({ error: 'Admin accounts cannot be suspended or deleted' });
    return null;
  }
  return user;
}

function validateReason(reason) {
  return MODERATION_REASONS.includes(reason) ? null : `reason must be one of: ${MODERATION_REASONS.join(', ')}`;
}

router.post('/users/:id/suspend', asyncHandler(async (req, res) => {
  const reasonError = validateReason(req.body?.reason);
  if (reasonError) return res.status(400).json({ error: reasonError });
  const user = await findModeratableUser(req, res);
  if (!user) return;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      suspendedAt: new Date(),
      suspensionReason: req.body.reason,
      // Signs the user out everywhere straight away.
      tokenVersion: { increment: 1 },
    },
    select: { id: true, suspendedAt: true, suspensionReason: true },
  });
  console.info(`Admin ${req.user.email} suspended user ${user.id} (${user.email}): ${req.body.reason}`);
  res.json(updated);
}));

router.post('/users/:id/unsuspend', asyncHandler(async (req, res) => {
  const user = await findModeratableUser(req, res);
  if (!user) return;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { suspendedAt: null, suspensionReason: null },
    select: { id: true, suspendedAt: true, suspensionReason: true },
  });
  console.info(`Admin ${req.user.email} lifted the suspension of user ${user.id} (${user.email})`);
  res.json(updated);
}));

// Permanent: the user row is deleted from the database, and with it, through
// the cascading relations in schema.prisma, everything that belongs to it:
// transactions, recurring transactions and their logs, budgets, goals,
// accounts, Finance AI messages, sign-in tokens and payments. An unfinished
// sign-up for the same email is not linked to the user, so it is removed
// explicitly. Nothing is kept to restore.
router.delete('/users/:id', asyncHandler(async (req, res) => {
  const reasonError = validateReason(req.body?.reason);
  if (reasonError) return res.status(400).json({ error: reasonError });
  const user = await findModeratableUser(req, res);
  if (!user) return;

  await prisma.$transaction([
    prisma.user.delete({ where: { id: user.id } }),
    prisma.pendingSignup.deleteMany({ where: { email: user.email } }),
  ]);
  console.info(`Admin ${req.user.email} deleted user ${user.id} (${user.email}): ${req.body.reason}`);
  res.status(204).end();
}));

export default router;
