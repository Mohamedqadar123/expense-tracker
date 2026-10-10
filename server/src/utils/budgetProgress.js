export const BUDGET_STATUS = {
  NORMAL: 'normal',
  WARNING: 'warning',
  NEAR_LIMIT: 'near_limit',
  EXCEEDED: 'exceeded',
};

export function getBudgetStatus(percentUsed) {
  if (percentUsed >= 100) return BUDGET_STATUS.EXCEEDED;
  if (percentUsed >= 90) return BUDGET_STATUS.NEAR_LIMIT;
  if (percentUsed >= 70) return BUDGET_STATUS.WARNING;
  return BUDGET_STATUS.NORMAL;
}

// Deliberately 2 queries total, regardless of how many budgets the user has
// (previously 1 + N — a separate aggregate query per budget — which turns a
// single dashboard/report/Finance-AI load into N+1 round trips and N+1
// connection-pool checkouts under load). Fetches every expense in the
// union of all budgets' date ranges once, then matches each budget's spend
// against that in-memory list instead of re-querying per budget.
export async function getBudgetProgress(prisma, userId) {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    orderBy: { startDate: 'desc' },
  });
  if (budgets.length === 0) return [];

  const rangeStart = new Date(Math.min(...budgets.map((b) => b.startDate.getTime())));
  const rangeEnd = new Date(Math.max(...budgets.map((b) => b.endDate.getTime())));

  const expenses = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'expense',
      date: { gte: rangeStart, lte: rangeEnd },
    },
    select: { amount: true, category: true, date: true },
  });

  return budgets.map((b) => {
    const category = b.category.toLowerCase();
    const spent = expenses.reduce((sum, t) => {
      const inRange = t.date >= b.startDate && t.date <= b.endDate;
      return inRange && t.category.toLowerCase() === category ? sum + t.amount : sum;
    }, 0);
    const percentUsed = b.amount > 0 ? (spent / b.amount) * 100 : 0;

    return {
      ...b,
      spent,
      remaining: b.amount - spent,
      percentUsed,
      status: getBudgetStatus(percentUsed),
    };
  });
}
