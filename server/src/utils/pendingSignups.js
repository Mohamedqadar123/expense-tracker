import { createHash, randomBytes } from 'node:crypto';
import prisma from '../prismaClient.js';
import { newTrialEnd } from '../services/subscription.js';
import { DEFAULT_ACCOUNT_NAME } from './accounts.js';

const PENDING_TTL_MS = 24 * 60 * 60 * 1000;

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

// A sign-up is held here, not in User, until the person proves the email
// address is theirs by opening the link sent to it. Signing up again with
// the same address replaces the earlier attempt, so only the newest link
// works. Returns the raw token to email; only its hash is stored.
export async function savePendingSignup({ email, passwordHash, name }) {
  const token = randomBytes(32).toString('hex');
  const data = {
    passwordHash,
    name: name || null,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + PENDING_TTL_MS),
  };
  await prisma.pendingSignup.upsert({ where: { email }, create: { email, ...data }, update: data });
  return token;
}

export async function findValidPendingSignup(token) {
  if (typeof token !== 'string' || !token) return null;
  const pending = await prisma.pendingSignup.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!pending || pending.expiresAt < new Date()) return null;
  return pending;
}

// Turns a confirmed sign-up into a real account. The email is verified by
// definition, and the free trial starts now rather than when the form was
// submitted, so time spent finding the email doesn't eat into it.
export async function registerPendingSignup(pending) {
  const [user] = await prisma.$transaction([
    prisma.user.create({
      data: {
        email: pending.email,
        passwordHash: pending.passwordHash,
        name: pending.name,
        emailVerifiedAt: new Date(),
        trialEndsAt: newTrialEnd(),
        // Every transaction belongs to an account, so a new user gets one
        // straight away and can start recording money coming in.
        accounts: { create: { name: DEFAULT_ACCOUNT_NAME } },
      },
    }),
    prisma.pendingSignup.delete({ where: { id: pending.id } }),
  ]);
  return user;
}
