import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/prismaClient.js';
import { resetDb, disconnectDb } from './testDb.js';
import { signupAndLogin, createSecondUser } from './helpers/authHelpers.js';
import { transactionPayload, budgetPayload, goalPayload, recurringPayload } from './helpers/fixtures.js';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await disconnectDb();
});

const resources = [
  {
    name: 'transactions',
    base: '/api/transactions',
    payload: transactionPayload(),
  },
  {
    name: 'budgets',
    base: '/api/budgets',
    payload: budgetPayload(),
  },
  {
    name: 'goals',
    base: '/api/goals',
    payload: goalPayload(),
  },
  {
    name: 'recurring-transactions',
    base: '/api/recurring-transactions',
    payload: recurringPayload(),
  },
];

describe('Cross-user isolation matrix', () => {
  for (const resource of resources) {
    it(`${resource.name}: PUT/DELETE on another user's resource returns 404, never a leak`, async () => {
      const { agent: agentA } = await signupAndLogin();
      const { agent: agentB } = await createSecondUser();

      const created = await agentA.post(resource.base).send(resource.payload);
      expect(created.status).toBe(201);

      const putRes = await agentB.put(`${resource.base}/${created.body.id}`).send(resource.payload);
      expect(putRes.status).toBe(404);
      expect(putRes.body).not.toMatchObject({ userId: expect.anything() });

      const delRes = await agentB.delete(`${resource.base}/${created.body.id}`);
      expect(delRes.status).toBe(404);
    });

    it(`${resource.name}: list endpoint never includes another user's rows, even with adjacent ids`, async () => {
      const { agent: agentA } = await signupAndLogin();
      const { agent: agentB } = await createSecondUser();

      await agentA.post(resource.base).send(resource.payload);
      await agentB.post(resource.base).send(resource.payload);
      await agentA.post(resource.base).send(resource.payload);

      const listA = await agentA.get(resource.base);
      const listB = await agentB.get(resource.base);
      const idsA = (listA.body.data || listA.body).map((r) => r.id);
      const idsB = (listB.body.data || listB.body).map((r) => r.id);
      expect(idsA.some((id) => idsB.includes(id))).toBe(false);
    });
  }
});

describe('requireAuth behavior', () => {
  it('rejects requests with no cookie', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(401);
  });

  it('rejects a malformed cookie', async () => {
    const res = await request(app).get('/api/transactions').set('Cookie', 'token=not-a-real-jwt');
    expect(res.status).toBe(401);
  });

  it('rejects a token with an invalid signature', async () => {
    const tampered = jwt.sign({ sub: 1, email: 'x@test.com', tokenVersion: 0 }, 'wrong-secret', { algorithm: 'HS256' });
    const res = await request(app).get('/api/transactions').set('Cookie', `token=${tampered}`);
    expect(res.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const expired = jwt.sign(
      { sub: 1, email: 'x@test.com', tokenVersion: 0 },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: -10 }
    );
    const res = await request(app).get('/api/transactions').set('Cookie', `token=${expired}`);
    expect(res.status).toBe(401);
  });

  it('rejects a stale cookie after tokenVersion has been bumped (simulated logout-all)', async () => {
    const { agent, user } = await signupAndLogin();

    const staleCheck = await agent.get('/api/auth/me');
    expect(staleCheck.status).toBe(200);

    await prisma.user.update({ where: { id: user.id }, data: { tokenVersion: { increment: 1 } } });

    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
