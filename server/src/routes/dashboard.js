import { Router } from 'express';
import prisma from '../prismaClient.js';
import { parseDateRange } from '../utils/dateRange.js';
import { getBudgetProgress } from '../utils/budgetProgress.js';
import { buildInsights } from '../utils/insights.js';

const router = Router();

function sumByType(groups, type) {
  const g = groups.find(x => x.type === type);
  return g?._sum.amount ?? 0;
}

function bucketGranularity(gte, lt) {
  const spanDays = (lt.getTime() - gte.getTime()) / (24 * 60 * 60 * 1000);
  if (spanDays <= 1) return 'hour';
  if (spanDays <= 31) return 'day';
  return 'month';
}

function bucketKeyFor(date, granularity) {
  const d = new Date(date);
  if (granularity === 'hour') return `${String(d.getUTCHours()).padStart(2, '0')}:00`;
  if (granularity === 'day') return d.toISOString().slice(0, 10);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function generateBuckets(gte, lt, granularity) {
  const buckets = [];
  if (granularity === 'hour') {
    let cursor = new Date(gte);
    while (cursor < lt) {
      buckets.push({ key: bucketKeyFor(cursor, 'hour'), income: 0, expenses: 0 });
      cursor = new Date(cursor.getTime() + 60 * 60 * 1000);
    }
  } else if (granularity === 'day') {
    let cursor = new Date(Date.UTC(gte.getUTCFullYear(), gte.getUTCMonth(), gte.getUTCDate()));
    while (cursor < lt) {
      buckets.push({ key: bucketKeyFor(cursor, 'day'), income: 0, expenses: 0 });
      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    }
  } else {
    let cursor = new Date(Date.UTC(gte.getUTCFullYear(), gte.getUTCMonth(), 1));
    while (cursor < lt) {
      buckets.push({ key: bucketKeyFor(cursor, 'month'), income: 0, expenses: 0 });
      cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
    }
  }
  return buckets;
}

router.get('/overview', async (req, res) => {
  const range = parseDateRange(req.query);
  if (!range) {
    return res.status(400).json({ error: 'start and end query params are required (YYYY-MM-DD)' });
  }
  const { gte, lt } = range;

  try {
    const now = new Date();
    const sixMonthsAgoStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
    const startOfNextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const [
      allTimeGroups,
      periodGroups,
      spendingByCategoryRaw,
      recentTransactions,
      monthlyExpenseTransactions,
      periodTransactions,
      budgetProgress,
    ] = await Promise.all([
      prisma.transaction.groupBy({ by: ['type'], _sum: { amount: true } }),
      prisma.transaction.groupBy({ by: ['type'], where: { date: { gte, lt } }, _sum: { amount: true } }),
      prisma.transaction.groupBy({
        by: ['category'],
        where: { type: 'expense', date: { gte, lt } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      prisma.transaction.findMany({ where: { date: { gte, lt } }, orderBy: { date: 'desc' }, take: 5 }),
      prisma.transaction.findMany({
        where: { type: 'expense', date: { gte: sixMonthsAgoStart, lt: startOfNextMonth } },
        select: { amount: true, date: true },
      }),
      prisma.transaction.findMany({ where: { date: { gte, lt } }, select: { amount: true, type: true, date: true } }),
      getBudgetProgress(prisma),
    ]);

    const totalBalance = sumByType(allTimeGroups, 'income') - sumByType(allTimeGroups, 'expense');
    const income = sumByType(periodGroups, 'income');
    const expenses = sumByType(periodGroups, 'expense');
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : null;

    const spendingByCategory = spendingByCategoryRaw.map(g => ({
      category: g.category,
      amount: g._sum.amount ?? 0,
    }));

    const monthlyBuckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = bucketKeyFor(d, 'month');
      monthlyBuckets.push({ key, month: key, amount: 0 });
    }
    const monthlyIndex = Object.fromEntries(monthlyBuckets.map((b, i) => [b.key, i]));
    for (const t of monthlyExpenseTransactions) {
      const key = bucketKeyFor(t.date, 'month');
      if (key in monthlyIndex) monthlyBuckets[monthlyIndex[key]].amount += t.amount;
    }
    const monthlySpendingTrend = monthlyBuckets.map(b => ({ month: b.month, amount: b.amount }));

    const granularity = bucketGranularity(gte, lt);
    const ivsBuckets = generateBuckets(gte, lt, granularity);
    const ivsIndex = Object.fromEntries(ivsBuckets.map((b, i) => [b.key, i]));
    for (const t of periodTransactions) {
      const key = bucketKeyFor(t.date, granularity);
      const idx = ivsIndex[key];
      if (idx === undefined) continue;
      if (t.type === 'income') ivsBuckets[idx].income += t.amount;
      else ivsBuckets[idx].expenses += t.amount;
    }
    const incomeVsExpenses = ivsBuckets.map(b => ({ bucket: b.key, income: b.income, expenses: b.expenses }));

    const summary = { totalBalance, income, expenses, savings, savingsRate };
    const insights = buildInsights({ summary, spendingByCategory, monthlySpendingTrend, budgetProgress });

    res.json({
      summary,
      monthlySpendingTrend,
      incomeVsExpenses,
      recentTransactions,
      spendingByCategory,
      insights,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

export default router;
