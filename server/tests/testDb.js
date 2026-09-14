import prisma from '../src/prismaClient.js';

export async function resetDb() {
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
