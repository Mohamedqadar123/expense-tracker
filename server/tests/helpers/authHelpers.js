import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/prismaClient.js';

// An account can't be debited beyond its balance, and almost every suite
// records expenses as part of testing something else. So test users start
// with plenty of money in their default account and in "Checking" (the
// account the transaction fixtures use). Pass { funded: false } to test the
// balance rule itself.
const TEST_STARTING_BALANCE = 1_000_000;

let counter = 0;

function uniqueEmail() {
  counter += 1;
  return `user-${Date.now()}-${counter}@test.com`;
}

export async function signupAndLogin(overrides = {}) {
  const agent = request.agent(app);
  const email = overrides.email || uniqueEmail();
  const password = overrides.password || 'password123';
  const name = overrides.name;
  const funded = overrides.funded !== false;

  const res = await agent.post('/api/auth/signup').send({ email, password, name });
  if (res.status !== 201) {
    throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`);
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
