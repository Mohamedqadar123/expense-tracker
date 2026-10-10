// Every user has at least this account, created at signup, so they can
// record money coming in from their very first transaction.
export const DEFAULT_ACCOUNT_NAME = 'Cash';

// Money moved into or out of a savings goal is recorded under this category.
// It is a transfer rather than earning or spending, so it is valid for both
// transaction types.
export const SAVINGS_CATEGORY = 'savings';

export function isSavingsCategory(category) {
  return String(category || '').toLowerCase() === SAVINGS_CATEGORY;
}

// Resolves the account a money movement belongs to, so that nothing is ever
// recorded without one:
// - a named account is matched case-insensitively and created if it doesn't
//   exist yet (which also keeps older API clients that send free-text names
//   working);
// - with no name, the user's first account is used, creating the default
//   one for accounts that somehow have none.
// Returns the account's canonical name, which is what Transaction.account
// stores.
export async function ensureAccountName(prisma, userId, requestedName) {
  const name = typeof requestedName === 'string' ? requestedName.trim() : '';

  if (name) {
    const existing = await prisma.account.findFirst({
      where: { userId, name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) return existing.name;
    const created = await prisma.account.create({ data: { userId, name } });
    return created.name;
  }

  const first = await prisma.account.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } });
  if (first) return first.name;
  const created = await prisma.account.create({ data: { userId, name: DEFAULT_ACCOUNT_NAME } });
  return created.name;
}
