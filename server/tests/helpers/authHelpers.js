import request from 'supertest';
import app from '../../src/app.js';

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

  const res = await agent.post('/api/auth/signup').send({ email, password, name });
  if (res.status !== 201) {
    throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return { agent, user: res.body, email, password };
}

export async function createSecondUser(overrides = {}) {
  return signupAndLogin(overrides);
}

export { uniqueEmail };
