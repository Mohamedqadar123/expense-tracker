import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/prismaClient.js';
import { resetDb, disconnectDb } from './testDb.js';
import { signupAndLogin } from './helpers/authHelpers.js';

const DAY_MS = 24 * 60 * 60 * 1000;
let agent;
let userId;

const givePlan = (plan, daysLeft) => prisma.user.update({
  where: { id: userId },
  data: { paidPlan: plan, paidUntil: new Date(Date.now() + daysLeft * DAY_MS) },
});

beforeEach(async () => {
  await resetDb();
  const login = await signupAndLogin();
  agent = login.agent;
  userId = login.user.id;
});

afterAll(async () => {
  await disconnectDb();
});

describe('POST /api/billing/unsubscribe', () => {
  it('requires a login', async () => {
    const res = await request(app).post('/api/billing/unsubscribe');
    expect(res.status).toBe(401);
  });

  it('refuses when there is no paid plan to leave (free trial)', async () => {
    const res = await agent.post('/api/billing/unsubscribe');
    expect(res.status).toBe(400);
  });

  it('marks the plan as cancelled but keeps the access already paid for', async () => {
    await givePlan('pro', 20);

    const res = await agent.post('/api/billing/unsubscribe');

    expect(res.status).toBe(200);
    expect(res.body.access).toMatchObject({ plan: 'pro', cancelled: true, hasAccess: true, hasFinanceAI: true });
    expect((await agent.get('/api/transactions')).status).toBe(200);
    expect((await agent.get('/api/auth/me')).body.access.cancelled).toBe(true);
  });

  it('does not move the cancellation date when asked twice', async () => {
    await givePlan('standard', 20);
    await agent.post('/api/billing/unsubscribe');
    const first = (await prisma.user.findUnique({ where: { id: userId } })).cancelledAt;

    await agent.post('/api/billing/unsubscribe');
    const second = (await prisma.user.findUnique({ where: { id: userId } })).cancelledAt;

    expect(second).toEqual(first);
  });

  it('refuses once the paid period has already ended', async () => {
    await givePlan('pro', -1);
    await prisma.user.update({ where: { id: userId }, data: { trialEndsAt: new Date(Date.now() - DAY_MS) } });

    const res = await agent.post('/api/billing/unsubscribe');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/billing/resubscribe', () => {
  it('undoes an unsubscribe', async () => {
    await givePlan('standard', 20);
    await agent.post('/api/billing/unsubscribe');

    const res = await agent.post('/api/billing/resubscribe');

    expect(res.status).toBe(200);
    expect(res.body.access).toMatchObject({ plan: 'standard', cancelled: false });
  });
});
