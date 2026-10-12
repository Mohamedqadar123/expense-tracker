import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';
import { isAdmin, getUserAccess } from '../utils/admin.js';
import { SUSPENDED_MESSAGE } from '../constants/moderation.js';

export default async function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      tokenVersion: true,
      emailVerifiedAt: true,
      trialEndsAt: true,
      paidPlan: true,
      paidUntil: true,
      cancelledAt: true,
      suspendedAt: true,
    },
  });

  if (!user || user.tokenVersion !== payload.tokenVersion) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (user.suspendedAt) {
    return res.status(403).json({ error: SUSPENDED_MESSAGE, code: 'account_suspended' });
  }

  req.user = { id: user.id, email: user.email, access: getUserAccess(user), isAdmin: isAdmin(user) };
  next();
}
