import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import prisma from '../src/prismaClient.js';
import { resetDb, disconnectDb } from './testDb.js';
import { signupAndLogin } from './helpers/authHelpers.js';
import { processDueRecurringTransactions } from '../src/utils/recurringTransactions.js';

let agent;
let userId;

const credit = (amount, account = 'Cash') =>
  agent.post('/api/transactions').send({ description: 'Pay', amount, type: 'income', category: 'Salary', account });
const debit = (amount, account = 'Cash') =>
  agent.post('/api/transactions').send({ description: 'Shop', amount, type: 'expense', category: 'Food', account });
const balanceOf = async (name) =>
  (await agent.get('/api/accounts')).body.find((account) => account.name === name).balance;

beforeEach(async () => {
  await resetDb();
  const login = await signupAndLogin({ funded: false });
  agent = login.agent;
  userId = login.user.id;
});

afterAll(async () => {
  await disconnectDb();
});

describe('new accounts', () => {
  it('gives a new user an empty default account they can credit straight away', async () => {
    expect(await balanceOf('Cash')).toBe(0);
    expect((await credit(500)).status).toBe(201);
    expect(await balanceOf('Cash')).toBe(500);
  });

  it('records a transaction against the default account when none is named', async () => {
    const res = await agent.post('/api/transactions').send({ description: 'Pay', amount: 50, type: 'income', category: 'Salary' });
    expect(res.status).toBe(201);
    expect(res.body.account).toBe('Cash');
  });
});

describe('debits need a balance to draw on', () => {
  it('refuses a debit from an account with no balance', async () => {
    const res = await debit(10);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no balance/i);
    expect(await balanceOf('Cash')).toBe(0);
  });

  it('refuses a debit larger than the balance', async () => {
    await credit(100);
    const res = await debit(100.01);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/only has \$100\.00/);
  });

  it('allows a debit of exactly the balance', async () => {
    await credit(100);
    expect((await debit(100)).status).toBe(201);
    expect(await balanceOf('Cash')).toBe(0);
  });

  it('checks each account separately', async () => {
    await credit(100, 'Cash');
    const res = await debit(10, 'Premier Bank');
    expect(res.status).toBe(400);
    expect(await balanceOf('Cash')).toBe(100);
  });

  it('counts the starting balance as money that can be debited', async () => {
    await agent.post('/api/accounts').send({ name: 'EVC Plus', startingBalance: 40 });
    expect((await debit(40, 'EVC Plus')).status).toBe(201);
    expect((await debit(1, 'EVC Plus')).status).toBe(400);
  });

  it('lets an existing debit be edited up to the balance it was drawn from', async () => {
    await credit(100);
    const created = await debit(60);
    const edit = (amount) => agent.put(`/api/transactions/${created.body.id}`)
      .send({ description: 'Shop', amount, type: 'expense', category: 'Food', account: 'Cash' });

    expect((await edit(100)).status).toBe(200);
    expect((await edit(101)).status).toBe(400);
    expect(await balanceOf('Cash')).toBe(0);
  });
});

describe('savings goals', () => {
  it('refuses to save more than the account holds', async () => {
    await credit(50);
    const res = await agent.post('/api/goals').send({ name: 'Laptop', targetAmount: 500, savedAmount: 80, account: 'Cash' });
    expect(res.status).toBe(400);
    expect(await prisma.savingsGoal.count({ where: { userId } })).toBe(0);
    expect(await balanceOf('Cash')).toBe(50);
  });

  it('debits the account for money saved and credits it back when the saved amount is lowered', async () => {
    await credit(200);
    const created = await agent.post('/api/goals').send({ name: 'Laptop', targetAmount: 500, savedAmount: 80, account: 'Cash' });
    expect(created.status).toBe(201);
    expect(await balanceOf('Cash')).toBe(120);

    await agent.put(`/api/goals/${created.body.id}`).send({ name: 'Laptop', targetAmount: 500, savedAmount: 30, account: 'Cash' });
    expect(await balanceOf('Cash')).toBe(170);
  });
});

describe('recurring transactions', () => {
  const createRule = (overrides = {}) => prisma.recurringTransaction.create({
    data: {
      description: 'Rent',
      amount: 100,
      type: 'expense',
      category: 'Rent',
      account: 'Cash',
      frequency: 'daily',
      status: 'active',
      startDate: new Date('2024-01-01T00:00:00.000Z'),
      nextExecutionDate: new Date('2024-01-01T00:00:00.000Z'),
      userId,
      ...overrides,
    },
  });
  const now = new Date('2024-01-01T23:00:00.000Z');

  it('skips and logs a due debit the account cannot cover, without overdrawing it', async () => {
    const rule = await createRule();

    const result = await processDueRecurringTransactions(prisma, { now });

    expect(result.totalGenerated).toBe(0);
    expect(await prisma.transaction.count({ where: { userId } })).toBe(0);
    const [log] = await prisma.recurringTransactionLog.findMany({ where: { recurringTransactionId: rule.id } });
    expect(log.status).toBe('skipped');
    expect(log.message).toMatch(/no balance/i);
  });

  it('records a generated debit against the rule\'s account', async () => {
    await credit(300);
    await createRule();

    const result = await processDueRecurringTransactions(prisma, { now });

    expect(result.totalGenerated).toBe(1);
    expect(await balanceOf('Cash')).toBe(200);
  });
});
