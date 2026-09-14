import { getBudgetProgress } from '../utils/budgetProgress.js';
import { RECENT_TRANSACTIONS_LIMIT } from '../constants/ai.js';

function sumByType(groups, type) {
  return groups.find((g) => g.type === type)?._sum.amount ?? 0;
}

function pctChange(curr, prev) {
  if (prev === 0) return null;
  return Number((((curr - prev) / Math.abs(prev)) * 100).toFixed(1));
}

// Computes a sanitized financial summary for a user, safe to hand to an
// external AI API. Never includes id/userId/email/name/passwordHash or any
// credential — only aggregate stats and a bounded recent-transaction list
// scoped to description/amount/type/category/account/date.
export async function buildFinancialSummary(prisma, userId) {
  const now = new Date();
  const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const previousMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

  const [
    allTimeGroups,
    currentGroups,
    previousGroups,
    currentCategoryRaw,
    previousCategoryRaw,
    recentTransactions,
    budgetProgressRaw,
    savingsGoalsRaw,
  ] = await Promise.all([
    prisma.transaction.groupBy({ by: ['type'], where: { userId }, _sum: { amount: true } }),
    prisma.transaction.groupBy({
      by: ['type'],
      where: { userId, date: { gte: currentMonthStart, lt: nextMonthStart } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ['type'],
      where: { userId, date: { gte: previousMonthStart, lt: currentMonthStart } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ['category'],
      where: { userId, type: 'expense', date: { gte: currentMonthStart, lt: nextMonthStart } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    }),
    prisma.transaction.groupBy({
      by: ['category'],
      where: { userId, type: 'expense', date: { gte: previousMonthStart, lt: currentMonthStart } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: RECENT_TRANSACTIONS_LIMIT,
      select: { description: true, amount: true, type: true, category: true, account: true, date: true },
    }),
    getBudgetProgress(prisma, userId),
    prisma.savingsGoal.findMany({
      where: { userId },
      select: { name: true, targetAmount: true, savedAmount: true, targetDate: true },
    }),
  ]);

  const toMonth = (groups, catGroups) => {
    const income = sumByType(groups, 'income');
    const expenses = sumByType(groups, 'expense');
    return {
      income,
      expenses,
      savings: income - expenses,
      savingsRate: income > 0 ? Number((((income - expenses) / income) * 100).toFixed(1)) : null,
      spendingByCategory: catGroups.map((g) => ({ category: g.category, amount: g._sum.amount ?? 0 })),
    };
  };

  const currentMonth = toMonth(currentGroups, currentCategoryRaw);
  const previousMonth = toMonth(previousGroups, previousCategoryRaw);

  return {
    asOf: now.toISOString(),
    accountBalance: sumByType(allTimeGroups, 'income') - sumByType(allTimeGroups, 'expense'),
    currentMonth: { label: currentMonthStart.toISOString().slice(0, 7), ...currentMonth },
    previousMonth: { label: previousMonthStart.toISOString().slice(0, 7), ...previousMonth },
    monthOverMonthChange: {
      incomeChangePct: pctChange(currentMonth.income, previousMonth.income),
      expenseChangePct: pctChange(currentMonth.expenses, previousMonth.expenses),
      savingsChangePct: pctChange(currentMonth.savings, previousMonth.savings),
    },
    budgets: budgetProgressRaw.map((b) => ({
      name: b.name,
      category: b.category,
      amount: b.amount,
      period: b.period,
      startDate: b.startDate,
      endDate: b.endDate,
      spent: b.spent,
      remaining: b.remaining,
      percentUsed: Number(b.percentUsed.toFixed(1)),
      status: b.status,
    })),
    savingsGoals: savingsGoalsRaw.map((g) => ({
      name: g.name,
      targetAmount: g.targetAmount,
      savedAmount: g.savedAmount,
      targetDate: g.targetDate,
      percentComplete: g.targetAmount > 0 ? Number(((g.savedAmount / g.targetAmount) * 100).toFixed(1)) : null,
    })),
    recentTransactions,
  };
}
