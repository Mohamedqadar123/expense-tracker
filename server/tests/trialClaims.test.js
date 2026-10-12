import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/prismaClient.js';
import { resetDb, disconnectDb } from './testDb.js';
import { registerUser } from './helpers/authHelpers.js';
import { canonicalEmail } from '../src/utils/trialClaims.js';
import { savePendingSignup, findValidPendingSignup, registerPendingSignup } from '../src/utils/pendingSignups.js';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await disconnectDb();
});

describe('canonicalEmail', () => {
  it('treats the ways of writing one Gmail mailbox as the same', () => {
    for (const variant of ['John@Gmail.com', 'j.o.h.n@gmail.com', 'john+trial2@gmail.com', 'JOHN@googlemail.com', ' john@gmail.com ']) {
      expect(canonicalEmail(variant)).toBe('john@gmail.com');
    }
  });

  it('drops +tags everywhere but keeps dots outside Gmail', () => {
    expect(canonicalEmail('jo.hn+x@outlook.com')).toBe('jo.hn@outlook.com');
  });
});

describe('the free trial is only for the first registration', () => {
  it('gives the first registration a trial', async () => {
    const user = await registerUser(`first-${Date.now()}@test.com`);
    expect(user.trialEndsAt).toBeTruthy();
  });

  it('gives no second trial after the account is deleted and registered again', async () => {
    const email = `again-${Date.now()}@test.com`;
    const first = await registerUser(email);
    await prisma.user.delete({ where: { id: first.id } });

    const signup = await request(app).post('/api/auth/signup').send({ email, password: 'password123' });
    expect(signup.status).toBe(202);
    expect(signup.body.trialAvailable).toBe(false);

    const second = await registerPendingSignup(await prisma.pendingSignup.findUnique({ where: { email } }));
    expect(second.trialEndsAt).toBeNull();
  });

  it('gives no trial to a variant of an email that already had one', async () => {
    const stamp = Date.now();
    await registerUser(`trialuser${stamp}@gmail.com`);
    const variant = await registerUser(`trial.user${stamp}+second@googlemail.com`);
    expect(variant.trialEndsAt).toBeNull();
  });

  it('grants exactly one trial when two variants are confirmed at the same moment', async () => {
    const stamp = Date.now();
    const pendings = await Promise.all(
      [`race${stamp}@gmail.com`, `r.a.c.e${stamp}+2@gmail.com`].map(async (email) => (
        findValidPendingSignup(await savePendingSignup({ email, passwordHash: 'x', name: null }))
      )),
    );
    const users = await Promise.all(pendings.map((pending) => registerPendingSignup(pending)));
    expect(users.filter((user) => user.trialEndsAt)).toHaveLength(1);
  });

  it('sends an account with no trial straight to choosing a plan', async () => {
    const email = `noplan-${Date.now()}@test.com`;
    const first = await registerUser(email);
    await prisma.user.delete({ where: { id: first.id } });
    await registerUser(email);

    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email, password: 'password123' });
    expect((await agent.get('/api/transactions')).status).toBe(402);
  });

  it('gives emails listed in TRIAL_EXEMPT_EMAILS a fresh trial every time, without making them admin', async () => {
    const email = `exempt-${Date.now()}@test.com`;
    const original = process.env.TRIAL_EXEMPT_EMAILS;
    process.env.TRIAL_EXEMPT_EMAILS = email;
    try {
      const first = await registerUser(email);
      await prisma.user.delete({ where: { id: first.id } });
      const second = await registerUser(email);
      expect(second.trialEndsAt).toBeTruthy();

      const agent = request.agent(app);
      const login = await agent.post('/api/auth/login').send({ email, password: 'password123' });
      expect(login.body.isAdmin).toBe(false);
      expect(login.body.access.plan).toBe('trial');
    } finally {
      process.env.TRIAL_EXEMPT_EMAILS = original;
    }
  });

  it('refuses temporary email services', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'someone@mailinator.com', password: 'password123' });
    expect(res.status).toBe(400);
  });
});
