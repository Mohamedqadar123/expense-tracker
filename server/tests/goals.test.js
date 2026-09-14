import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb, disconnectDb } from './testDb.js';
import { signupAndLogin, createSecondUser } from './helpers/authHelpers.js';
import { goalPayload } from './helpers/fixtures.js';

let agent;

beforeEach(async () => {
  await resetDb();
  const login = await signupAndLogin();
  agent = login.agent;
});

afterAll(async () => {
  await disconnectDb();
});

describe('Savings goals CRUD', () => {
  it('creates, lists, updates, and deletes a goal', async () => {
    const created = await agent.post('/api/goals').send(goalPayload());
    expect(created.status).toBe(201);

    const list = await agent.get('/api/goals');
    expect(list.body).toHaveLength(1);

    const updated = await agent.put(`/api/goals/${created.body.id}`).send(goalPayload({ savedAmount: 250 }));
    expect(updated.status).toBe(200);
    expect(updated.body.savedAmount).toBe(250);

    const deleted = await agent.delete(`/api/goals/${created.body.id}`);
    expect(deleted.status).toBe(204);
  });

  it('returns 404 (not 403) for another user\'s goal', async () => {
    const { agent: agentB } = await createSecondUser();
    const created = await agent.post('/api/goals').send(goalPayload());

    const putRes = await agentB.put(`/api/goals/${created.body.id}`).send(goalPayload({ savedAmount: 999 }));
    expect(putRes.status).toBe(404);
    const delRes = await agentB.delete(`/api/goals/${created.body.id}`);
    expect(delRes.status).toBe(404);
  });
});

describe('Savings goal validation', () => {
  it.each([
    ['zero', 0],
    ['negative', -100],
    ['NaN-producing', 'not-a-number'],
  ])('rejects a %s targetAmount', async (_label, targetAmount) => {
    const res = await agent.post('/api/goals').send(goalPayload({ targetAmount }));
    expect(res.status).toBe(400);
  });

  it('rejects a negative savedAmount', async () => {
    const res = await agent.post('/api/goals').send(goalPayload({ savedAmount: -1 }));
    expect(res.status).toBe(400);
  });

  it('defaults savedAmount to 0 when omitted', async () => {
    const payload = goalPayload();
    delete payload.savedAmount;
    const res = await agent.post('/api/goals').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.savedAmount).toBe(0);
  });

  it('accepts savedAmount === targetAmount (100% complete)', async () => {
    const res = await agent.post('/api/goals').send(goalPayload({ targetAmount: 500, savedAmount: 500 }));
    expect(res.status).toBe(201);
  });

  it('accepts savedAmount > targetAmount (over-funded, clamping is frontend-only)', async () => {
    const res = await agent.post('/api/goals').send(goalPayload({ targetAmount: 500, savedAmount: 750 }));
    expect(res.status).toBe(201);
    expect(res.body.savedAmount).toBe(750);
  });
});
