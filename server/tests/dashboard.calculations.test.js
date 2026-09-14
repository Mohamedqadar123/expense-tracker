import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import prisma from '../src/prismaClient.js';
import { resetDb, disconnectDb } from './testDb.js';
import { signupAndLogin, createSecondUser } from './helpers/authHelpers.js';

let agent;
let userId;

beforeEach(async () => {
  await resetDb();
  const login = await signupAndLogin();
  agent = login.agent;
  userId = login.user.id;
});

afterAll(async () => {
  await disconnectDb();
});

async function seed(date, rows) {
  await prisma.transaction.createMany({
    data: rows.map((r) => ({ date: new Date(date), userId, account: null, ...r })),
  });
}

describe('Dashboard income/expense/balance calculations', () => {
  it('computes the exact example: income $5000, expenses $150 + $95 -> balance $4755', async () => {
    await seed('2024-06-10', [
      { description: 'Paycheck', amount: 5000, type: 'income', category: 'Salary' },
      { description: 'Groceries', amount: 150, type: 'expense', category: 'Food' },
      { description: 'Utilities bill', amount: 95, type: 'expense', category: 'Utilities' },
    ]);

    const res = await agent.get('/api/dashboard/overview?start=2024-06-01&end=2024-06-30');
    expect(res.status).toBe(200);
    expect(res.body.summary.income).toBe(5000);
    expect(res.body.summary.expenses).toBe(245);
    expect(res.body.summary.totalBalance).toBe(4755);
    expect(res.body.summary.savings).toBe(4755);
    expect(res.body.summary.savingsRate).toBeCloseTo(95.1, 5);
  });

  it('updates sums correctly as more transactions are added', async () => {
    await seed('2024-06-10', [
      { description: 'Paycheck', amount: 5000, type: 'income', category: 'Salary' },
      { description: 'Groceries', amount: 150, type: 'expense', category: 'Food' },
      { description: 'Utilities bill', amount: 95, type: 'expense', category: 'Utilities' },
      { description: 'Bonus', amount: 1000, type: 'income', category: 'Salary' },
      { description: 'Rent', amount: 500, type: 'expense', category: 'Rent' },
    ]);

    const res = await agent.get('/api/dashboard/overview?start=2024-06-01&end=2024-06-30');
    expect(res.body.summary.income).toBe(6000);
    expect(res.body.summary.expenses).toBe(745);
    expect(res.body.summary.totalBalance).toBe(5255);
  });

  it('excludes out-of-range transactions from period totals but still counts them in the all-time balance', async () => {
    await seed('2024-06-10', [
      { description: 'In range income', amount: 1000, type: 'income', category: 'Salary' },
    ]);
    await seed('2024-01-01', [
      { description: 'Out of range expense', amount: 300, type: 'expense', category: 'Food' },
    ]);

    const res = await agent.get('/api/dashboard/overview?start=2024-06-01&end=2024-06-30');
    expect(res.body.summary.income).toBe(1000);
    expect(res.body.summary.expenses).toBe(0);
    // totalBalance is all-time (income - expense across everything), so the
    // January expense outside the query window still reduces it.
    expect(res.body.summary.totalBalance).toBe(700);
  });

  it('returns savingsRate: null (not 0 or NaN) when there is no income in range', async () => {
    await seed('2024-06-10', [
      { description: 'Groceries', amount: 100, type: 'expense', category: 'Food' },
    ]);

    const res = await agent.get('/api/dashboard/overview?start=2024-06-01&end=2024-06-30');
    expect(res.body.summary.income).toBe(0);
    expect(res.body.summary.savingsRate).toBeNull();
  });

  it('requires start and end query params', async () => {
    const res = await agent.get('/api/dashboard/overview');
    expect(res.status).toBe(400);
  });

  it('never reflects another user\'s transactions', async () => {
    const { agent: agentB, user: userB } = await createSecondUser();
    await prisma.transaction.create({
      data: { description: 'Other user income', amount: 99999, type: 'income', category: 'Salary', date: new Date('2024-06-10'), userId: userB.id },
    });
    await seed('2024-06-10', [
      { description: 'My income', amount: 1000, type: 'income', category: 'Salary' },
    ]);

    const res = await agent.get('/api/dashboard/overview?start=2024-06-01&end=2024-06-30');
    expect(res.body.summary.income).toBe(1000);
    expect(res.body.summary.totalBalance).toBe(1000);
    void agentB;
  });
});
