import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/prismaClient.js';
import { registerPendingSignup } from '../../src/utils/pendingSignups.js';

// An account can't be debited beyond its balance, and almost every suite
// records expenses as part of testing something else. So test users start
// with plenty of money in their default account and in "Checking" (the
// account the transaction fixtures use). Pass { funded: false } to test the
// balance rule itself.
const TEST_STARTING_BALANCE = 1_000_000_000_000;

let counter = 0;

function uniqueEmail() {
  counter += 1;
  return `user-${Date.now()}-${counter}@test.com`;
}

// Signing up only creates the account once the emailed link is opened. The
// link's token is stored hashed, so tests can't read it back; instead this
// confirms the pending sign-up the same way the verify-email route does.
export async function registerUser(email, password = 'password123', name) {
  const res = await request(app).post('/api/auth/signup').send({ email, password, name });
  if (res.status !== 202) {
    throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  const pending = await prisma.pendingSignup.findUnique({ where: { email } });
  return registerPendingSignup(pending);
}

export async function signupAndLogin(overrides = {}) {
  const agent = request.agent(app);
  const email = overrides.email || uniqueEmail();
  const password = overrides.password || 'password123';
  const name = overrides.name;
  const funded = overrides.funded !== false;

  await registerUser(email, password, name);
  const res = await agent.post('/api/auth/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  if (funded) {
    await prisma.account.updateMany({
      where: { userId: res.body.id },
      data: { startingBalance: TEST_STARTING_BALANCE },
    });
    await prisma.account.create({
      data: { userId: res.body.id, name: 'Checking', startingBalance: TEST_STARTING_BALANCE },
    });
  }

  return { agent, user: res.body, email, password };
}

export async function createSecondUser(overrides = {}) {
  return signupAndLogin(overrides);
}

export { uniqueEmail };
