import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { resetDb, disconnectDb } from './testDb.js';
import prisma from '../src/prismaClient.js';
import { signupAndLogin, registerUser, uniqueEmail } from './helpers/authHelpers.js';
import { savePendingSignup } from '../src/utils/pendingSignups.js';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await disconnectDb();
});

describe('POST /api/auth/signup', () => {
  it('holds the sign-up until the email is confirmed: no account, no session', async () => {
    const email = uniqueEmail();
    const res = await request(app).post('/api/auth/signup').send({ email, password: 'password123' });

    expect(res.status).toBe(202);
    expect(res.body.email).toBe(email);
    expect(res.headers['set-cookie']).toBeUndefined();
    expect(await prisma.user.count({ where: { email } })).toBe(0);
    expect(await prisma.pendingSignup.count({ where: { email } })).toBe(1);
  });

  it('cannot log in before the email is confirmed', async () => {
    const email = uniqueEmail();
    await registerUser(email);

    const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('keeps only the newest attempt when the same email signs up again', async () => {
    const email = uniqueEmail();
    await request(app).post('/api/auth/signup').send({ email, password: 'password123' });
    const res = await request(app).post('/api/auth/signup').send({ email, password: 'password456' });

    expect(res.status).toBe(202);
    expect(await prisma.pendingSignup.count({ where: { email } })).toBe(1);
  });

  it('rejects an invalid email', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('rejects a password shorter than 8 characters', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: uniqueEmail(), password: '1234567' });
    expect(res.status).toBe(400);
  });

  it('accepts a password exactly 8 characters', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: uniqueEmail(), password: '12345678' });
    expect(res.status).toBe(202);
  });

  it('rejects a password longer than 128 characters', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: uniqueEmail(), password: 'a'.repeat(129) });
    expect(res.status).toBe(400);
  });

  it('accepts a password exactly 128 characters', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: uniqueEmail(), password: 'a'.repeat(128) });
    expect(res.status).toBe(202);
  });

  it('rejects an email that already has an account', async () => {
    const email = uniqueEmail();
    await registerUser(email);
    const res = await request(app).post('/api/auth/signup').send({ email, password: 'password456' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/verify-email', () => {
  it('creates the account from a confirmed sign-up, verified and signed in', async () => {
    const email = uniqueEmail();
    const token = await savePendingSignup({ email, passwordHash: 'not-a-real-hash', name: 'Moha' });

    const res = await request(app).post('/api/auth/verify-email').send({ token });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(email);
    expect(res.body.emailVerifiedAt).toBeTruthy();
    expect(res.body.access.plan).toBe('trial');
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.headers['set-cookie'][0]).toMatch(/token=/);
    expect(await prisma.pendingSignup.count({ where: { email } })).toBe(0);
    expect(await prisma.account.count({ where: { user: { email } } })).toBe(1);
  });

  it('works only once', async () => {
    const token = await savePendingSignup({ email: uniqueEmail(), passwordHash: 'not-a-real-hash' });
    await request(app).post('/api/auth/verify-email').send({ token });

    const res = await request(app).post('/api/auth/verify-email').send({ token });
    expect(res.status).toBe(400);
  });

  it('rejects an unknown token without creating anything', async () => {
    const res = await request(app).post('/api/auth/verify-email').send({ token: 'made-up' });
    expect(res.status).toBe(400);
    expect(await prisma.user.count()).toBe(0);
  });

  it('rejects an expired sign-up link', async () => {
    const email = uniqueEmail();
    const token = await savePendingSignup({ email, passwordHash: 'not-a-real-hash' });
    await prisma.pendingSignup.update({ where: { email }, data: { expiresAt: new Date(Date.now() - 1000) } });

    const res = await request(app).post('/api/auth/verify-email').send({ token });
    expect(res.status).toBe(400);
    expect(await prisma.user.count({ where: { email } })).toBe(0);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const email = uniqueEmail();
    await registerUser(email);

    const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects a wrong password with 401', async () => {
    const email = uniqueEmail();
    await registerUser(email);

    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects a nonexistent email with the same response shape as wrong password', async () => {
    const wrongPasswordRes = await (async () => {
      const email = uniqueEmail();
      await registerUser(email);
      return request(app).post('/api/auth/login').send({ email, password: 'wrongpassword' });
    })();

    const nonexistentRes = await request(app)
      .post('/api/auth/login')
      .send({ email: uniqueEmail(), password: 'password123' });

    expect(nonexistentRes.status).toBe(401);
    expect(Object.keys(nonexistentRes.body)).toEqual(Object.keys(wrongPasswordRes.body));
  });

  it('rejects a missing email or password with 400', async () => {
    const res1 = await request(app).post('/api/auth/login').send({ password: 'password123' });
    expect(res1.status).toBe(400);
    const res2 = await request(app).post('/api/auth/login').send({ email: uniqueEmail() });
    expect(res2.status).toBe(400);
  });

  it('does not 429 across 15 rapid login attempts (NODE_ENV=test bypass)', async () => {
    const email = uniqueEmail();
    await registerUser(email);

    for (let i = 0; i < 15; i++) {
      const res = await request(app).post('/api/auth/login').send({ email, password: 'wrongpassword' });
      expect(res.status).not.toBe(429);
    }
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the auth cookie', async () => {
    const { agent } = await signupAndLogin();
    const res = await agent.post('/api/auth/logout');
    expect(res.status).toBe(204);
    expect(res.headers['set-cookie'][0]).toMatch(/token=;/);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the sanitized current user when authenticated', async () => {
    const { agent, email } = await signupAndLogin();
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
    expect(res.body).not.toHaveProperty('passwordHash');
  });
});
