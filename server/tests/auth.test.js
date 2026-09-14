import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { resetDb, disconnectDb } from './testDb.js';
import { signupAndLogin, uniqueEmail } from './helpers/authHelpers.js';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await disconnectDb();
});

describe('POST /api/auth/signup', () => {
  it('creates a user and sets an auth cookie', async () => {
    const email = uniqueEmail();
    const res = await request(app).post('/api/auth/signup').send({ email, password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(email);
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.body).not.toHaveProperty('tokenVersion');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/token=/);
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
    expect(res.status).toBe(201);
  });

  it('rejects a password longer than 128 characters', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: uniqueEmail(), password: 'a'.repeat(129) });
    expect(res.status).toBe(400);
  });

  it('accepts a password exactly 128 characters', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: uniqueEmail(), password: 'a'.repeat(128) });
    expect(res.status).toBe(201);
  });

  it('rejects a duplicate email', async () => {
    const email = uniqueEmail();
    await request(app).post('/api/auth/signup').send({ email, password: 'password123' });
    const res = await request(app).post('/api/auth/signup').send({ email, password: 'password456' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const email = uniqueEmail();
    await request(app).post('/api/auth/signup').send({ email, password: 'password123' });

    const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects a wrong password with 401', async () => {
    const email = uniqueEmail();
    await request(app).post('/api/auth/signup').send({ email, password: 'password123' });

    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects a nonexistent email with the same response shape as wrong password', async () => {
    const wrongPasswordRes = await (async () => {
      const email = uniqueEmail();
      await request(app).post('/api/auth/signup').send({ email, password: 'password123' });
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
    await request(app).post('/api/auth/signup').send({ email, password: 'password123' });

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
