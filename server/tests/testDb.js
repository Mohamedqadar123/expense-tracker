import prisma from '../src/prismaClient.js';

// Guards against ever truncating the wrong database again: on 2026-09-14, a
// missing .env.test caused DATABASE_URL to silently fall back to the dev
// database (via app.js's `import 'dotenv/config'`), and resetDb() wiped it.
// Every call site of resetDb() must re-verify DATABASE_URL points at the
// isolated test database before doing anything destructive.
export function assertTestDatabase() {
  const url = process.env.DATABASE_URL || '';
  if (!/expense_tracker_test/.test(url)) {
    throw new Error(
      `Refusing to run: DATABASE_URL does not point at the test database ` +
      `(got "${url.replace(/:[^:@]*@/, ':****@')}"). Expected it to contain ` +
      `"expense_tracker_test". Make sure server/.env.test exists and is loaded ` +
      `before any test runs — see server/docker-compose.test.yml.`
    );
  }
}

export async function resetDb() {
  assertTestDatabase();
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "RecurringTransactionLog", "Transaction", "RecurringTransaction",
      "Budget", "SavingsGoal", "AiMessage", "User"
    RESTART IDENTITY CASCADE;
  `);
}

export async function disconnectDb() {
  await prisma.$disconnect();
}
