import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import prisma from '../src/prismaClient.js';
import { resetDb, disconnectDb } from './testDb.js';
import { signupAndLogin } from './helpers/authHelpers.js';

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

describe('Reports calculations', () => {
  it('computes the exact example: income $5000, expenses $150 + $95 -> balance $4755', async () => {
    await seed('2024-06-10', [
      { description: 'Paycheck', amount: 5000, type: 'income', category: 'Salary' },
      { description: 'Groceries', amount: 150, type: 'expense', category: 'Food' },
      { description: 'Utilities bill', amount: 95, type: 'expense', category: 'Utilities' },
    ]);

    const res = await agent.get('/api/reports/overview?start=2024-06-01&end=2024-06-30');
    expect(res.status).toBe(200);
    expect(res.body.summary.income).toBe(5000);
    expect(res.body.summary.expenses).toBe(245);
    expect(res.body.summary.totalBalance).toBe(4755);
  });

  it('reconciles expenseByCategory/incomeByCategory totals with summary totals', async () => {
    await seed('2024-06-10', [
      { description: 'Paycheck', amount: 4000, type: 'income', category: 'Salary' },
      { description: 'Freelance', amount: 1000, type: 'income', category: 'Freelance' },
      { description: 'Groceries', amount: 150, type: 'expense', category: 'Food' },
      { description: 'Utilities bill', amount: 95, type: 'expense', category: 'Utilities' },
    ]);

    const res = await agent.get('/api/reports/overview?start=2024-06-01&end=2024-06-30');
    const expenseSum = res.body.expenseByCategory.reduce((s, c) => s + c.amount, 0);
    const incomeSum = res.body.incomeByCategory.reduce((s, c) => s + c.amount, 0);
    expect(expenseSum).toBe(res.body.summary.expenses);
    expect(incomeSum).toBe(res.body.summary.income);
  });

  it('reconciles dailyCashFlow net totals with summary savings', async () => {
    await seed('2024-06-10', [
      { description: 'Paycheck', amount: 1000, type: 'income', category: 'Salary' },
      { description: 'Groceries', amount: 200, type: 'expense', category: 'Food' },
    ]);

    const res = await agent.get('/api/reports/overview?start=2024-06-01&end=2024-06-30');
    const netSum = res.body.dailyCashFlow.reduce((s, d) => s + d.net, 0);
    expect(netSum).toBeCloseTo(res.body.summary.savings, 5);
  });

  it('includes exactly the seeded transactions for the range in the raw transactions list', async () => {
    await seed('2024-06-10', [
      { description: 'In range', amount: 100, type: 'expense', category: 'Food' },
    ]);
    await seed('2024-01-01', [
      { description: 'Out of range', amount: 100, type: 'expense', category: 'Food' },
    ]);

    const res = await agent.get('/api/reports/overview?start=2024-06-01&end=2024-06-30');
    expect(res.body.transactions).toHaveLength(1);
    expect(res.body.transactions[0].description).toBe('In range');
  });

  it('returns 400 when start/end are missing', async () => {
    const res = await agent.get('/api/reports/overview');
    expect(res.status).toBe(400);
  });
});
