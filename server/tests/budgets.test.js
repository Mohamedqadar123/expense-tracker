import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import prisma from '../src/prismaClient.js';
import { resetDb, disconnectDb } from './testDb.js';
import { signupAndLogin, createSecondUser } from './helpers/authHelpers.js';
import { budgetPayload } from './helpers/fixtures.js';

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

describe('Budgets CRUD', () => {
  it('creates, lists, updates, and deletes a budget', async () => {
    const created = await agent.post('/api/budgets').send(budgetPayload());
    expect(created.status).toBe(201);
    expect(created.body.category).toBe('Food');

    const list = await agent.get('/api/budgets');
    expect(list.body).toHaveLength(1);

    const updated = await agent.put(`/api/budgets/${created.body.id}`).send(budgetPayload({ amount: 300 }));
    expect(updated.status).toBe(200);
    expect(updated.body.amount).toBe(300);

    const deleted = await agent.delete(`/api/budgets/${created.body.id}`);
    expect(deleted.status).toBe(204);
  });

  it('returns 404 (not 403) for another user\'s budget', async () => {
    const { agent: agentB } = await createSecondUser();
    const created = await agent.post('/api/budgets').send(budgetPayload());

    const putRes = await agentB.put(`/api/budgets/${created.body.id}`).send(budgetPayload({ amount: 999 }));
    expect(putRes.status).toBe(404);
    const delRes = await agentB.delete(`/api/budgets/${created.body.id}`);
    expect(delRes.status).toBe(404);
  });
});

describe('Budget validation', () => {
  it('rejects a category not in the canonical list', async () => {
    const res = await agent.post('/api/budgets').send(budgetPayload({ category: 'NotARealCategory' }));
    expect(res.status).toBe(400);
  });

  it('accepts a canonical category case-insensitively', async () => {
    const res = await agent.post('/api/budgets').send(budgetPayload({ category: 'food' }));
    expect(res.status).toBe(201);
    expect(res.body.category).toBe('Food');
  });

  it('rejects amount <= 0', async () => {
    const res = await agent.post('/api/budgets').send(budgetPayload({ amount: 0 }));
    expect(res.status).toBe(400);
  });

  it('rejects an invalid period', async () => {
    const res = await agent.post('/api/budgets').send(budgetPayload({ period: 'daily' }));
    expect(res.status).toBe(400);
  });

  it('rejects startDate >= endDate', async () => {
    const res = await agent.post('/api/budgets').send(budgetPayload({ startDate: '2024-02-01', endDate: '2024-01-01' }));
    expect(res.status).toBe(400);
  });
});

describe('Budget progress integration', () => {
  it('reports spent/remaining based on real seeded expenses in the budget category and period', async () => {
    const created = await agent.post('/api/budgets').send(
      budgetPayload({ category: 'Food', amount: 200, startDate: '2024-01-01', endDate: '2024-01-31' })
    );

    await prisma.transaction.createMany({
      data: [
        { description: 'Groceries 1', amount: 100, type: 'expense', category: 'Food', date: new Date('2024-01-05'), userId },
        { description: 'Groceries 2', amount: 50, type: 'expense', category: 'Food', date: new Date('2024-01-15'), userId },
        { description: 'Out of category', amount: 999, type: 'expense', category: 'Rent', date: new Date('2024-01-10'), userId },
      ],
    });

    const res = await agent.get('/api/budgets');
    const budget = res.body.find((b) => b.id === created.body.id);
    expect(budget.spent).toBe(150);
    expect(budget.remaining).toBe(50);
    expect(budget.percentUsed).toBe(75);
  });
});
