import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb, disconnectDb } from './testDb.js';
import { signupAndLogin, createSecondUser } from './helpers/authHelpers.js';
import { transactionPayload } from './helpers/fixtures.js';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await disconnectDb();
});

describe('Transactions CRUD', () => {
  it('creates a transaction', async () => {
    const { agent } = await signupAndLogin();
    const res = await agent.post('/api/transactions').send(transactionPayload());
    expect(res.status).toBe(201);
    expect(res.body.description).toBe('Test transaction');
    expect(res.body.amount).toBe(100);
  });

  it('lists only the caller\'s own transactions', async () => {
    const { agent: agentA } = await signupAndLogin();
    const { agent: agentB } = await createSecondUser();

    await agentA.post('/api/transactions').send(transactionPayload({ description: 'A1' }));
    await agentA.post('/api/transactions').send(transactionPayload({ description: 'A2' }));
    await agentB.post('/api/transactions').send(transactionPayload({ description: 'B1' }));

    const res = await agentA.get('/api/transactions');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.map((t) => t.description).sort()).toEqual(['A1', 'A2']);
  });

  it('updates an owned transaction', async () => {
    const { agent } = await signupAndLogin();
    const created = await agent.post('/api/transactions').send(transactionPayload());
    const res = await agent
      .put(`/api/transactions/${created.body.id}`)
      .send(transactionPayload({ description: 'Updated', amount: 200 }));

    expect(res.status).toBe(200);
    expect(res.body.description).toBe('Updated');
    expect(res.body.amount).toBe(200);
  });

  it('deletes an owned transaction', async () => {
    const { agent } = await signupAndLogin();
    const created = await agent.post('/api/transactions').send(transactionPayload());
    const del = await agent.delete(`/api/transactions/${created.body.id}`);
    expect(del.status).toBe(204);

    const list = await agent.get('/api/transactions');
    expect(list.body.data).toHaveLength(0);
  });

  it('returns 404 (not 403) when updating another user\'s transaction', async () => {
    const { agent: agentA } = await signupAndLogin();
    const { agent: agentB } = await createSecondUser();
    const created = await agentA.post('/api/transactions').send(transactionPayload());

    const res = await agentB.put(`/api/transactions/${created.body.id}`).send(transactionPayload({ description: 'Hack' }));
    expect(res.status).toBe(404);
  });

  it('returns 404 (not 403) when deleting another user\'s transaction', async () => {
    const { agent: agentA } = await signupAndLogin();
    const { agent: agentB } = await createSecondUser();
    const created = await agentA.post('/api/transactions').send(transactionPayload());

    const res = await agentB.delete(`/api/transactions/${created.body.id}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 for a nonexistent transaction id on update/delete', async () => {
    const { agent } = await signupAndLogin();
    const putRes = await agent.put('/api/transactions/999999').send(transactionPayload());
    expect(putRes.status).toBe(404);
    const delRes = await agent.delete('/api/transactions/999999');
    expect(delRes.status).toBe(404);
  });
});
