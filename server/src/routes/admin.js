import { Router } from 'express';
import prisma from '../prismaClient.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { getAccess } from '../services/subscription.js';

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

export default router;
