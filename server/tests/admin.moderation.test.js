import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/prismaClient.js';
import { resetDb, disconnectDb } from './testDb.js';
import { signupAndLogin, uniqueEmail } from './helpers/authHelpers.js';
import { transactionPayload } from './helpers/fixtures.js';

const originalAdminEmails = process.env.ADMIN_EMAILS;

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  process.env.ADMIN_EMAILS = originalAdminEmails;
  await disconnectDb();
});

// isAdmin reads ADMIN_EMAILS on every request, so it can be set per test.
async function signupAdmin() {
  const email = uniqueEmail();
  process.env.ADMIN_EMAILS = email;
  return signupAndLogin({ email });
}

describe('admin access', () => {
  it('never asks an admin to pay: full access after the trial has ended', async () => {
    const { agent, user } = await signupAdmin();
    await prisma.user.update({
      where: { id: user.id },
      data: { trialEndsAt: new Date(Date.now() - 1000), paidPlan: null, paidUntil: null },
    });

    const me = await agent.get('/api/auth/me');
    expect(me.body.access).toMatchObject({ plan: 'admin', hasAccess: true, hasFinanceAI: true });
    expect((await agent.get('/api/transactions')).status).toBe(200);
    expect((await agent.get('/api/ai/messages')).status).toBe(200);
  });

  it('still asks an ordinary user to pay once the trial has ended', async () => {
    await signupAdmin();
    const { agent, user } = await signupAndLogin();
    await prisma.user.update({ where: { id: user.id }, data: { trialEndsAt: new Date(Date.now() - 1000) } });

    expect((await agent.get('/api/transactions')).status).toBe(402);
  });
});

describe('admin moderation', () => {
  it('is not reachable for ordinary accounts', async () => {
    await signupAdmin();
    const { agent } = await signupAndLogin();
    const { user: target } = await signupAndLogin();

    const res = await agent.post(`/api/admin/users/${target.id}/suspend`).send({ reason: 'non_payment' });
    expect(res.status).toBe(404);
  });

  it('requires a valid reason', async () => {
    const { agent } = await signupAdmin();
    const { user: target } = await signupAndLogin();

    const suspend = await agent.post(`/api/admin/users/${target.id}/suspend`).send({ reason: 'because' });
    expect(suspend.status).toBe(400);
    const del = await agent.delete(`/api/admin/users/${target.id}`).send({});
    expect(del.status).toBe(400);
  });

  it('suspends a user: signs them out, blocks login, and can be lifted', async () => {
    const { agent } = await signupAdmin();
    const { agent: targetAgent, user: target, email, password } = await signupAndLogin();

    const res = await agent.post(`/api/admin/users/${target.id}/suspend`).send({ reason: 'terms_violation' });
    expect(res.status).toBe(200);
    expect(res.body.suspensionReason).toBe('terms_violation');

    // The existing session no longer works.
    expect((await targetAgent.get('/api/auth/me')).status).toBe(401);

    const login = await request(app).post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(403);
    expect(login.body.code).toBe('account_suspended');

    const overview = await agent.get('/api/admin/overview');
    const row = overview.body.users.find((u) => u.id === target.id);
    expect(row.suspendedAt).toBeTruthy();
    expect(row.suspensionReason).toBe('terms_violation');

    expect((await agent.post(`/api/admin/users/${target.id}/unsuspend`)).status).toBe(200);
    expect((await request(app).post('/api/auth/login').send({ email, password })).status).toBe(200);
  });

  it('deletes a user and all of their data', async () => {
    const { agent } = await signupAdmin();
    const { agent: targetAgent, user: target } = await signupAndLogin();
    await targetAgent.post('/api/transactions').send(transactionPayload());

    const res = await agent.delete(`/api/admin/users/${target.id}`).send({ reason: 'non_payment' });
    expect(res.status).toBe(204);

    const where = { userId: target.id };
    expect(await prisma.user.findUnique({ where: { id: target.id } })).toBeNull();
    expect(await prisma.transaction.count({ where })).toBe(0);
    expect(await prisma.account.count({ where })).toBe(0);
    expect(await prisma.authToken.count({ where })).toBe(0);
    expect(await prisma.payment.count({ where })).toBe(0);
    expect(await prisma.pendingSignup.count({ where: { email: target.email } })).toBe(0);
  });

  it('cannot act on the admin themselves or another admin', async () => {
    const { agent, user: admin } = await signupAdmin();
    const other = await signupAndLogin();
    process.env.ADMIN_EMAILS = `${process.env.ADMIN_EMAILS},${other.email}`;

    const self = await agent.post(`/api/admin/users/${admin.id}/suspend`).send({ reason: 'non_payment' });
    expect(self.status).toBe(400);
    const otherAdmin = await agent.delete(`/api/admin/users/${other.user.id}`).send({ reason: 'non_payment' });
    expect(otherAdmin.status).toBe(400);
  });

  it('answers 404 for a user that does not exist', async () => {
    const { agent } = await signupAdmin();
    const res = await agent.delete('/api/admin/users/999999').send({ reason: 'non_payment' });
    expect(res.status).toBe(404);
  });
});
