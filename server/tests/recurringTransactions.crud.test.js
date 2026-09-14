import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb, disconnectDb } from './testDb.js';
import { signupAndLogin, createSecondUser } from './helpers/authHelpers.js';
import { recurringPayload } from './helpers/fixtures.js';

let agent;

beforeEach(async () => {
  await resetDb();
  const login = await signupAndLogin();
  agent = login.agent;
});

afterAll(async () => {
  await disconnectDb();
});

describe('Recurring transactions CRUD', () => {
  it('creates, lists, updates, and deletes a recurring rule', async () => {
    const created = await agent.post('/api/recurring-transactions').send(recurringPayload());
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('active');

    const list = await agent.get('/api/recurring-transactions');
    expect(list.body).toHaveLength(1);

    const updated = await agent.put(`/api/recurring-transactions/${created.body.id}`).send(recurringPayload({ amount: 75 }));
    expect(updated.status).toBe(200);
    expect(updated.body.amount).toBe(75);

    const deleted = await agent.delete(`/api/recurring-transactions/${created.body.id}`);
    expect(deleted.status).toBe(204);
  });

  it('pauses and resumes a rule', async () => {
    const created = await agent.post('/api/recurring-transactions').send(recurringPayload());

    const paused = await agent.patch(`/api/recurring-transactions/${created.body.id}/pause`);
    expect(paused.status).toBe(200);
    expect(paused.body.status).toBe('paused');

    const resumed = await agent.patch(`/api/recurring-transactions/${created.body.id}/resume`);
    expect(resumed.status).toBe(200);
    expect(resumed.body.status).toBe('active');
  });

  it('returns history for a rule', async () => {
    const created = await agent.post('/api/recurring-transactions').send(recurringPayload());
    const res = await agent.get(`/api/recurring-transactions/${created.body.id}/history`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 404 (not 403) for another user\'s rule', async () => {
    const { agent: agentB } = await createSecondUser();
    const created = await agent.post('/api/recurring-transactions').send(recurringPayload());

    const putRes = await agentB.put(`/api/recurring-transactions/${created.body.id}`).send(recurringPayload({ amount: 999 }));
    expect(putRes.status).toBe(404);
    const pauseRes = await agentB.patch(`/api/recurring-transactions/${created.body.id}/pause`);
    expect(pauseRes.status).toBe(404);
    const delRes = await agentB.delete(`/api/recurring-transactions/${created.body.id}`);
    expect(delRes.status).toBe(404);
  });
});

describe('Recurring transaction validation', () => {
  it('rejects amount <= 0', async () => {
    const res = await agent.post('/api/recurring-transactions').send(recurringPayload({ amount: 0 }));
    expect(res.status).toBe(400);
  });

  it('rejects an invalid type', async () => {
    const res = await agent.post('/api/recurring-transactions').send(recurringPayload({ type: 'transfer' }));
    expect(res.status).toBe(400);
  });

  it('rejects an income type paired with a non-income category', async () => {
    const res = await agent.post('/api/recurring-transactions').send(recurringPayload({ type: 'income', category: 'Utilities' }));
    expect(res.status).toBe(400);
  });

  it('rejects an expense type paired with an income category', async () => {
    const res = await agent.post('/api/recurring-transactions').send(recurringPayload({ type: 'expense', category: 'Salary' }));
    expect(res.status).toBe(400);
  });

  it('accepts an income type paired with an income category', async () => {
    const res = await agent.post('/api/recurring-transactions').send(recurringPayload({ type: 'income', category: 'Salary' }));
    expect(res.status).toBe(201);
  });

  it('rejects an invalid frequency', async () => {
    const res = await agent.post('/api/recurring-transactions').send(recurringPayload({ frequency: 'hourly' }));
    expect(res.status).toBe(400);
  });

  it('rejects an endDate before startDate', async () => {
    const res = await agent
      .post('/api/recurring-transactions')
      .send(recurringPayload({ startDate: '2024-02-01', endDate: '2024-01-01' }));
    expect(res.status).toBe(400);
  });

  it('accepts an omitted endDate', async () => {
    const payload = recurringPayload();
    const res = await agent.post('/api/recurring-transactions').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.endDate).toBeNull();
  });
});

describe('Recurring transaction status filtering', () => {
  it('excludes a paused rule when filtering by status=active', async () => {
    const a = await agent.post('/api/recurring-transactions').send(recurringPayload({ description: 'A' }));
    const b = await agent.post('/api/recurring-transactions').send(recurringPayload({ description: 'B' }));
    await agent.patch(`/api/recurring-transactions/${b.body.id}/pause`);

    const res = await agent.get('/api/recurring-transactions?status=active');
    expect(res.body.map((r) => r.id)).toEqual([a.body.id]);
  });
});
