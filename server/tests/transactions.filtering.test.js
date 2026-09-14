import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import prisma from '../src/prismaClient.js';
import { resetDb, disconnectDb } from './testDb.js';
import { signupAndLogin } from './helpers/authHelpers.js';

// The create/update endpoints never accept a client-supplied `date` (it always
// defaults to now()), so seeding fixed historical dates for filter tests must
// go directly through Prisma rather than through the API.
let agent;
let userId;

beforeEach(async () => {
  await resetDb();
  const login = await signupAndLogin();
  agent = login.agent;
  userId = login.user.id;

  await prisma.transaction.createMany({
    data: [
      { description: 'Groceries run', amount: 50, type: 'expense', category: 'Food', account: 'Checking', date: new Date('2024-01-05'), userId },
      { description: 'Salary', amount: 5000, type: 'income', category: 'Salary', account: 'Checking', date: new Date('2024-01-01'), userId },
      { description: 'Bus pass', amount: 30, type: 'expense', category: 'Transport', account: 'Cash', date: new Date('2024-01-10'), userId },
      { description: 'Movie night', amount: 15, type: 'expense', category: 'Entertainment', account: 'Checking', date: new Date('2024-01-15'), userId },
    ],
  });
});

afterAll(async () => {
  await disconnectDb();
});

describe('Transaction filtering', () => {
  it('filters by type=income', async () => {
    const res = await agent.get('/api/transactions?type=income');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].description).toBe('Salary');
  });

  it('filters by type=expense', async () => {
    const res = await agent.get('/api/transactions?type=expense');
    expect(res.body.data).toHaveLength(3);
  });

  it('filters by category', async () => {
    const res = await agent.get('/api/transactions?category=Food');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].description).toBe('Groceries run');
  });

  it('filters by account', async () => {
    const res = await agent.get('/api/transactions?account=Cash');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].description).toBe('Bus pass');
  });

  it('filters by search (case-insensitive description match)', async () => {
    const res = await agent.get('/api/transactions?search=movie');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].description).toBe('Movie night');
  });

  it('filters by date range (inclusive of both bounds)', async () => {
    const res = await agent.get('/api/transactions?startDate=2024-01-05&endDate=2024-01-10');
    expect(res.body.data.map((t) => t.description).sort()).toEqual(['Bus pass', 'Groceries run']);
  });

  it('filters by minAmount/maxAmount inclusive of bounds', async () => {
    const res = await agent.get('/api/transactions?minAmount=15&maxAmount=30');
    expect(res.body.data.map((t) => t.description).sort()).toEqual(['Bus pass', 'Movie night']);
  });

  it('combines type and category filters', async () => {
    const res = await agent.get('/api/transactions?type=expense&category=Transport');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].description).toBe('Bus pass');
  });

  it('sorts by newest first', async () => {
    const res = await agent.get('/api/transactions?sort=newest');
    expect(res.body.data.map((t) => t.description)).toEqual(['Movie night', 'Bus pass', 'Groceries run', 'Salary']);
  });

  it('sorts by oldest first', async () => {
    const res = await agent.get('/api/transactions?sort=oldest');
    expect(res.body.data.map((t) => t.description)).toEqual(['Salary', 'Groceries run', 'Bus pass', 'Movie night']);
  });

  it('sorts by amount descending', async () => {
    const res = await agent.get('/api/transactions?sort=amount_desc');
    expect(res.body.data.map((t) => t.amount)).toEqual([5000, 50, 30, 15]);
  });

  it('sorts by amount ascending', async () => {
    const res = await agent.get('/api/transactions?sort=amount_asc');
    expect(res.body.data.map((t) => t.amount)).toEqual([15, 30, 50, 5000]);
  });
});
