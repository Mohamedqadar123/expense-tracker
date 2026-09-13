import { PrismaClient } from '@prisma/client';
import { processDueRecurringTransactions } from '../src/utils/recurringTransactions.js';

const prisma = new PrismaClient();

async function main() {
  console.log(`[runRecurringTransactions] started at ${new Date().toISOString()}`);
  const summary = await processDueRecurringTransactions(prisma);
  console.log(`[runRecurringTransactions] finished: ${JSON.stringify(summary)}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
