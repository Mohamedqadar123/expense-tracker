import { Router } from 'express';
import prisma from '../prismaClient.js';
import { parseDateRange } from '../utils/dateRange.js';
import { getBudgetProgress } from '../utils/budgetProgress.js';
import { bucketGranularity, bucketKeyFor, generateBuckets } from '../utils/dateBuckets.js';

const router = Router();

function sumByType(groups, type) {
  const g = groups.find(x => x.type === type);
  return g?._sum.amount ?? 0;
}

router.get('/overview', async (req, res) => {
  const range = parseDateRange(req.query);
  if (!range) {
    return res.status(400).json({ error: 'start and end query params are required (YYYY-MM-DD)' });
  }
  const { gte, lt } = range;
  const userId = req.user.id;

  try {
    const now = new Date();
    const sixMonthsAgoStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
    const startOfNextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const [
      allTimeGroups,
      periodGroups,
      expenseByCategoryRaw,
      incomeByCategoryRaw,
      periodTransactions,
      sixMonthTransactions,
      transactions,
      budgetProgress,
    ] = await Promise.all([
      prisma.transaction.groupBy({ by: ['type'], where: { userId }, _sum: { amount: true } }),
      prisma.transaction.groupBy({ by: ['type'], where: { userId, date: { gte, lt } }, _sum: { amount: true } }),
      prisma.transaction.groupBy({
        by: ['category'],
        where: { userId, type: 'expense', date: { gte, lt } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      prisma.transaction.groupBy({
        by: ['category'],
        where: { userId, type: 'income', date: { gte, lt } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      prisma.transaction.findMany({
        where: { userId, date: { gte, lt } },
        select: { amount: true, type: true, date: true },
      }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: sixMonthsAgoStart, lt: startOfNextMonth } },
        select: { amount: true, type: true, date: true },
      }),
      prisma.transaction.findMany({
        where: { userId, date: { gte, lt } },
        orderBy: { date: 'desc' },
      }),
      getBudgetProgress(prisma, userId),
    ]);

    const totalBalance = sumByType(allTimeGroups, 'income') - sumByType(allTimeGroups, 'expense');
    const income = sumByType(periodGroups, 'income');
    const expenses = sumByType(periodGroups, 'expense');
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : null;
    const summary = { totalBalance, income, expenses, savings, savingsRate };

    const expenseByCategory = expenseByCategoryRaw.map(g => ({
      category: g.category,
      amount: g._sum.amount ?? 0,
    }));
    const incomeByCategory = incomeByCategoryRaw.map(g => ({
      category: g.category,
      amount: g._sum.amount ?? 0,
    }));

    const dailyGranularity = bucketGranularity(gte, lt) === 'hour' ? 'hour' : 'day';
    const dailyBuckets = generateBuckets(gte, lt, dailyGranularity);
    const dailyIndex = Object.fromEntries(dailyBuckets.map((b, i) => [b.key, i]));
    for (const t of periodTransactions) {
      const key = bucketKeyFor(t.date, dailyGranularity);
      const idx = dailyIndex[key];
      if (idx === undefined) continue;
      if (t.type === 'income') dailyBuckets[idx].income += t.amount;
      else dailyBuckets[idx].expenses += t.amount;
    }
    const dailyCashFlow = dailyBuckets.map(b => ({
      date: b.key,
      income: b.income,
      expenses: b.expenses,
      net: b.income - b.expenses,
    }));

    const monthlyBuckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = bucketKeyFor(d, 'month');
      monthlyBuckets.push({ key, income: 0, expenses: 0 });
    }
    const monthlyIndex = Object.fromEntries(monthlyBuckets.map((b, i) => [b.key, i]));
    for (const t of sixMonthTransactions) {
      const key = bucketKeyFor(t.date, 'month');
      const idx = monthlyIndex[key];
      if (idx === undefined) continue;
      if (t.type === 'income') monthlyBuckets[idx].income += t.amount;
      else monthlyBuckets[idx].expenses += t.amount;
    }
    const monthlyCashFlow = monthlyBuckets.map(b => ({
      month: b.key,
      income: b.income,
      expenses: b.expenses,
      net: b.income - b.expenses,
    }));

    res.json({
      summary,
      expenseByCategory,
      incomeByCategory,
      dailyCashFlow,
      monthlyCashFlow,
      budgetProgress,
      transactions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load report data' });
  }
});

export default router;
