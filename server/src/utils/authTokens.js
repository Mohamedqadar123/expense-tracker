import { createHash, randomBytes } from 'node:crypto';
import prisma from '../prismaClient.js';

export const RESET_PASSWORD = 'reset_password';
// The confirmation link from signing up, after it has created the account.
// It keeps signing that account in until the link's own expiry, so opening
// it again (a second tap, another device, an email app that opened it first
// to scan it) lands in the app instead of on "link expired". Created in
// pendingSignups.js with the link's existing hash, not by issueAuthToken.
export const SIGNUP_LINK = 'signup_link';

const TTL_MS = {
  [RESET_PASSWORD]: 60 * 60 * 1000,
};

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

// Issuing a new token invalidates any earlier one of the same type, so only
// the most recent email's link works.
export async function issueAuthToken(userId, type) {
  const token = randomBytes(32).toString('hex');
  await prisma.$transaction([
    prisma.authToken.deleteMany({ where: { userId, type } }),
    prisma.authToken.create({
      data: { userId, type, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + TTL_MS[type]) },
    }),
  ]);
  return token;
}

export async function findValidAuthToken(token, type) {
  if (typeof token !== 'string' || !token) return null;
  const record = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.type !== type || record.expiresAt < new Date()) return null;
  return record;
}
