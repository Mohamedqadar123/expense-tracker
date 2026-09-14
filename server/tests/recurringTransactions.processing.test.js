import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import prisma from '../src/prismaClient.js';
import { resetDb, disconnectDb } from './testDb.js';
import { signupAndLogin } from './helpers/authHelpers.js';
import { processDueRecurringTransactions, generateOccurrence } from '../src/utils/recurringTransactions.js';

let userId;

beforeEach(async () => {
  await resetDb();
  const login = await signupAndLogin();
  userId = login.user.id;
});

afterAll(async () => {
  await disconnectDb();
});

async function createRule(overrides = {}) {
  return prisma.recurringTransaction.create({
    data: {
      description: 'Rent',
      amount: 100,
      type: 'expense',
      category: 'Rent',
      frequency: 'daily',
      status: 'active',
      startDate: new Date('2024-01-01T00:00:00.000Z'),
      nextExecutionDate: new Date('2024-01-01T00:00:00.000Z'),
      userId,
      ...overrides,
    },
  });
}

describe('processDueRecurringTransactions', () => {
  it('generates one transaction and advances nextExecutionDate for a single overdue rule', async () => {
    const rule = await createRule({ nextExecutionDate: new Date('2024-01-01T00:00:00.000Z') });
    // Same day as the due occurrence but before the next one (01-02T00:00) is due,
    // so exactly one occurrence should be generated (the loop condition is <=).
    const now = new Date('2024-01-01T23:00:00.000Z');

    const result = await processDueRecurringTransactions(prisma, { now });
    expect(result.totalGenerated).toBe(1);

    const transactions = await prisma.transaction.findMany({ where: { recurringTransactionId: rule.id } });
    expect(transactions).toHaveLength(1);

    const logs = await prisma.recurringTransactionLog.findMany({ where: { recurringTransactionId: rule.id } });
    expect(logs).toHaveLength(1);

    const updated = await prisma.recurringTransaction.findUnique({ where: { id: rule.id } });
    expect(updated.nextExecutionDate.toISOString()).toBe('2024-01-02T00:00:00.000Z');
  });

  it('catches up a multi-day backlog in one run', async () => {
    await createRule({ nextExecutionDate: new Date('2024-01-01T00:00:00.000Z') });
    // Due dates 01-01 through 01-05 inclusive are <= now (loop condition is <=);
    // 01-06 is not yet due.
    const now = new Date('2024-01-05T12:00:00.000Z');

    const result = await processDueRecurringTransactions(prisma, { now });
    expect(result.totalGenerated).toBe(5);

    const transactions = await prisma.transaction.findMany({ where: { userId, type: 'expense' } });
    expect(transactions).toHaveLength(5);
  });

  it('stops generating once nextExecutionDate would pass endDate', async () => {
    await createRule({
      nextExecutionDate: new Date('2024-01-01T00:00:00.000Z'),
      endDate: new Date('2024-01-02T00:00:00.000Z'),
    });
    const now = new Date('2024-01-10T00:00:00.000Z');

    const result = await processDueRecurringTransactions(prisma, { now });
    expect(result.totalGenerated).toBe(2);
  });

  it('excludes a paused rule from due-generation', async () => {
    await createRule({ status: 'paused', nextExecutionDate: new Date('2024-01-01T00:00:00.000Z') });
    const now = new Date('2024-01-05T00:00:00.000Z');

    const result = await processDueRecurringTransactions(prisma, { now });
    expect(result.rulesProcessed).toBe(0);
  });
});

describe('generateOccurrence concurrency safety', () => {
  it('produces exactly one transaction when called concurrently for the same occurrence', async () => {
    const rule = await createRule({ nextExecutionDate: new Date('2024-01-01T00:00:00.000Z') });
    const occurrenceDate = new Date('2024-01-01T00:00:00.000Z');
    const nextOccurrenceDate = new Date('2024-01-02T00:00:00.000Z');

    const results = await Promise.all([
      generateOccurrence(prisma, rule.id, occurrenceDate, nextOccurrenceDate),
      generateOccurrence(prisma, rule.id, occurrenceDate, nextOccurrenceDate),
    ]);

    const claimedCount = results.filter((r) => r.claimed && !r.alreadyLogged).length;
    expect(claimedCount).toBe(1);

    const transactions = await prisma.transaction.findMany({ where: { recurringTransactionId: rule.id } });
    expect(transactions).toHaveLength(1);
  });
});
