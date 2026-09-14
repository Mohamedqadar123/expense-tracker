import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import prisma from '../src/prismaClient.js';
import { resetDb, disconnectDb } from './testDb.js';
import { signupAndLogin } from './helpers/authHelpers.js';

let agent;

beforeEach(async () => {
  await resetDb();
  const login = await signupAndLogin();
  agent = login.agent;

  await prisma.transaction.createMany({
    data: Array.from({ length: 30 }, (_, i) => ({
      description: `Txn ${i}`,
      amount: 10 + i,
      type: 'expense',
      category: 'Food',
      date: new Date(Date.UTC(2024, 0, i + 1)),
      userId: login.user.id,
    })),
  });
});

afterAll(async () => {
  await disconnectDb();
});

describe('Transaction pagination', () => {
  it('defaults to page 1, limit 25', async () => {
    const res = await agent.get('/api/transactions');
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(25);
    expect(res.body.data).toHaveLength(25);
    expect(res.body.total).toBe(30);
    expect(res.body.totalPages).toBe(2);
  });

  it('accepts limit=100 (the max)', async () => {
    const res = await agent.get('/api/transactions?limit=100');
    expect(res.body.limit).toBe(100);
    expect(res.body.data).toHaveLength(30);
  });

  it('clamps limit=101 down to the max of 100', async () => {
    const res = await agent.get('/api/transactions?limit=101');
    expect(res.body.limit).toBe(100);
  });

  it('returns the next slice on page 2 with no overlap', async () => {
    const page1 = await agent.get('/api/transactions?limit=25&sort=oldest');
    const page2 = await agent.get('/api/transactions?page=2&limit=25&sort=oldest');

    expect(page2.body.data).toHaveLength(5);
    const page1Ids = new Set(page1.body.data.map((t) => t.id));
    const page2Ids = page2.body.data.map((t) => t.id);
    for (const id of page2Ids) {
      expect(page1Ids.has(id)).toBe(false);
    }
  });

  it('returns an empty array for a page beyond available data', async () => {
    const res = await agent.get('/api/transactions?page=99&limit=25');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
