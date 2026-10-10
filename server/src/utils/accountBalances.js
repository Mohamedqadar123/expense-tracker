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

// Current balance of a single account, by name. `excludeTransactionId` leaves
// one transaction out of the sum, which is how an edit is checked: the
// balance is worked out as if the transaction being edited didn't exist yet.
export async function getAccountBalance(prisma, userId, accountName, { excludeTransactionId } = {}) {
  const account = await prisma.account.findFirst({
    where: { userId, name: { equals: accountName, mode: 'insensitive' } },
  });
  const sums = await prisma.transaction.groupBy({
    by: ['type'],
    where: {
      userId,
      account: { equals: accountName, mode: 'insensitive' },
      ...(excludeTransactionId ? { id: { not: excludeTransactionId } } : {}),
    },
    _sum: { amount: true },
  });
  const income = sums.find((s) => s.type === 'income')?._sum.amount ?? 0;
  const expense = sums.find((s) => s.type === 'expense')?._sum.amount ?? 0;
  return (account?.startingBalance ?? 0) + income - expense;
}

// An account can only pay out money it actually holds. Returns the reason a
// debit of `amount` must be refused, or null if the account can cover it.
export async function getDebitError(prisma, userId, accountName, amount, options) {
  const balance = await getAccountBalance(prisma, userId, accountName, options);
  // Compared in whole cents so float noise (0.1 + 0.2) never blocks a debit
  // of exactly the available balance.
  if (Math.round(amount * 100) <= Math.round(balance * 100)) return null;
  if (balance <= 0) {
    return `"${accountName}" has no balance to debit. Credit the account first.`;
  }
  return `"${accountName}" only has $${balance.toFixed(2)} available. Credit the account first or debit a smaller amount.`;
}
