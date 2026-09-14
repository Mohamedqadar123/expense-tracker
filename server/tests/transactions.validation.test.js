import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb, disconnectDb } from './testDb.js';
import { signupAndLogin } from './helpers/authHelpers.js';
import { transactionPayload } from './helpers/fixtures.js';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await disconnectDb();
});

describe('Transaction amount boundary matrix', () => {
  it.each([
    ['smallest valid positive', 0.01, 201],
    ['ordinary decimal', 19.99, 201],
    ['large value', 999999999, 201],
    ['zero rejected', 0, 400],
    ['negative rejected', -50, 400],
    ['non-numeric rejected', 'not-a-number', 400],
    ['missing amount rejected', undefined, 400],
    ['empty string rejected', '', 400],
  ])('%s (amount=%p) -> %i', async (_label, amount, expectedStatus) => {
    const { agent } = await signupAndLogin();
    const payload = transactionPayload({ amount });
    if (amount === undefined) delete payload.amount;
    const res = await agent.post('/api/transactions').send(payload);
    expect(res.status).toBe(expectedStatus);
  });

  it('rejects Infinity', async () => {
    const { agent } = await signupAndLogin();
    const res = await agent
      .post('/api/transactions')
      .set('Content-Type', 'application/json')
      .send('{"description":"x","amount":Infinity,"type":"expense","category":"Food"}'.replace('Infinity', '1e999'));
    // 1e999 parses to Infinity in JS/JSON — Number.isFinite(Infinity) is false.
    expect(res.status).toBe(400);
  });

  it('sums multiple decimal transactions correctly (float precision)', async () => {
    const { agent } = await signupAndLogin();
    const today = new Date().toISOString().slice(0, 10);
    await agent.post('/api/transactions').send(transactionPayload({ amount: 0.1, type: 'income', category: 'Salary' }));
    await agent.post('/api/transactions').send(transactionPayload({ amount: 0.2, type: 'income', category: 'Salary' }));

    const res = await agent.get(`/api/dashboard/overview?start=${today}&end=${today}`);
    expect(res.status).toBe(200);
    expect(res.body.summary.income).toBeCloseTo(0.3, 5);
  });
});

describe('Transaction field validation', () => {
  it('rejects missing/blank description', async () => {
    const { agent } = await signupAndLogin();
    const res1 = await agent.post('/api/transactions').send(transactionPayload({ description: '' }));
    expect(res1.status).toBe(400);
    const res2 = await agent.post('/api/transactions').send(transactionPayload({ description: '   ' }));
    expect(res2.status).toBe(400);
  });

  it('rejects missing/blank category', async () => {
    const { agent } = await signupAndLogin();
    const res = await agent.post('/api/transactions').send(transactionPayload({ category: '' }));
    expect(res.status).toBe(400);
  });

  it('rejects an invalid type', async () => {
    const { agent } = await signupAndLogin();
    const res = await agent.post('/api/transactions').send(transactionPayload({ type: 'transfer' }));
    expect(res.status).toBe(400);
  });

  it('rejects an income type paired with a non-income category', async () => {
    const { agent } = await signupAndLogin();
    const res = await agent.post('/api/transactions').send(transactionPayload({ type: 'income', category: 'Food' }));
    expect(res.status).toBe(400);
  });

  it('rejects an expense type paired with an income category', async () => {
    const { agent } = await signupAndLogin();
    const res = await agent.post('/api/transactions').send(transactionPayload({ type: 'expense', category: 'Salary' }));
    expect(res.status).toBe(400);
  });

  it('accepts an income type paired with an income category', async () => {
    const { agent } = await signupAndLogin();
    const res = await agent.post('/api/transactions').send(transactionPayload({ type: 'income', category: 'Salary' }));
    expect(res.status).toBe(201);
  });

  it('rejects a non-string account', async () => {
    const { agent } = await signupAndLogin();
    const res = await agent.post('/api/transactions').send(transactionPayload({ account: 12345 }));
    expect(res.status).toBe(400);
  });
});

describe('Transaction query validation', () => {
  it('rejects an invalid type filter', async () => {
    const { agent } = await signupAndLogin();
    const res = await agent.get('/api/transactions?type=bogus');
    expect(res.status).toBe(400);
  });

  it('rejects an invalid sort option', async () => {
    const { agent } = await signupAndLogin();
    const res = await agent.get('/api/transactions?sort=bogus');
    expect(res.status).toBe(400);
  });

  it('rejects a non-positive page', async () => {
    const { agent } = await signupAndLogin();
    const res = await agent.get('/api/transactions?page=0');
    expect(res.status).toBe(400);
  });

  it('rejects a non-positive limit', async () => {
    const { agent } = await signupAndLogin();
    const res = await agent.get('/api/transactions?limit=0');
    expect(res.status).toBe(400);
  });

  it('rejects a non-numeric minAmount/maxAmount', async () => {
    const { agent } = await signupAndLogin();
    const res = await agent.get('/api/transactions?minAmount=abc');
    expect(res.status).toBe(400);
  });

  it('rejects minAmount greater than maxAmount', async () => {
    const { agent } = await signupAndLogin();
    const res = await agent.get('/api/transactions?minAmount=100&maxAmount=10');
    expect(res.status).toBe(400);
  });

  it('rejects an invalid date range', async () => {
    const { agent } = await signupAndLogin();
    const res = await agent.get('/api/transactions?startDate=not-a-date');
    expect(res.status).toBe(400);
  });
});
