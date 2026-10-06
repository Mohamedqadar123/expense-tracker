import { createHash, randomBytes } from 'node:crypto';
import prisma from '../prismaClient.js';

export const VERIFY_EMAIL = 'verify_email';
export const RESET_PASSWORD = 'reset_password';

const TTL_MS = {
  [VERIFY_EMAIL]: 24 * 60 * 60 * 1000,
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
