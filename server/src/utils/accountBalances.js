// An account's current balance is never stored — it's always derived as
// startingBalance + sum(its income transactions) - sum(its expense
// transactions), computed fresh here, so it can never drift out of sync
// with the transaction history the way a stored running balance could.
//
// Deliberately 2 queries total, regardless of how many accounts the user
// has (previously 1 + N — a separate groupBy per account — which turns
// every Accounts-page load and every transaction-form mount into N+1
// round trips and N+1 connection-pool checkouts under load). Fetches every
// account's income/expense sums in one groupBy, then matches each account
// against that in-memory list instead of re-querying per account.
export async function getAccountBalances(prisma, userId) {
  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
  if (accounts.length === 0) return [];

  const sums = await prisma.transaction.groupBy({
    by: ['account', 'type'],
    where: { userId, account: { not: null } },
    _sum: { amount: true },
  });

  return accounts.map((account) => {
    const name = account.name.toLowerCase();
    const forAccount = sums.filter((s) => s.account?.toLowerCase() === name);
    const income = forAccount.find((s) => s.type === 'income')?._sum.amount ?? 0;
    const expense = forAccount.find((s) => s.type === 'expense')?._sum.amount ?? 0;

    return {
      ...account,
      income,
      expense,
      balance: account.startingBalance + income - expense,
    };
  });
}
