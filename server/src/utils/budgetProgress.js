export async function getBudgetProgress(prisma) {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const startOfNextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const [budgets, spend] = await Promise.all([
    prisma.budget.findMany({ orderBy: { category: 'asc' } }),
    prisma.transaction.groupBy({
      by: ['category'],
      where: { type: 'expense', date: { gte: startOfMonth, lt: startOfNextMonth } },
      _sum: { amount: true },
    }),
  ]);

  const spendByCategory = Object.fromEntries(spend.map(s => [s.category, s._sum.amount ?? 0]));

  return budgets.map(b => {
    const spent = spendByCategory[b.category] ?? 0;
    return {
      ...b,
      spent,
      remaining: b.monthlyLimit - spent,
      percentUsed: b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0,
    };
  });
}
