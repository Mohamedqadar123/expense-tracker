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

export async function getBudgetProgress(prisma, userId) {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    orderBy: { startDate: 'desc' },
  });

  return Promise.all(
    budgets.map(async (b) => {
      const spendAgg = await prisma.transaction.aggregate({
        where: {
          userId,
          type: 'expense',
          category: { equals: b.category, mode: 'insensitive' },
          date: { gte: b.startDate, lte: b.endDate },
        },
        _sum: { amount: true },
      });

      const spent = spendAgg._sum.amount ?? 0;
      const percentUsed = b.amount > 0 ? (spent / b.amount) * 100 : 0;

      return {
        ...b,
        spent,
        remaining: b.amount - spent,
        percentUsed,
        status: getBudgetStatus(percentUsed),
      };
    })
  );
}
