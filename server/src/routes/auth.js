import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import prisma from '../prismaClient.js';
import requireAuth from '../middleware/requireAuth.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { createRateLimitStore } from '../rateLimitStore.js';
import { getAccess, newTrialEnd } from '../services/subscription.js';
import { isAdmin } from '../utils/admin.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { issueAuthToken, findValidAuthToken, VERIFY_EMAIL, RESET_PASSWORD } from '../utils/authTokens.js';

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const BCRYPT_COST = 12;
const MAX_PASSWORD_LENGTH = 128;

// Precomputed once so the "user not found" branch of login still pays a
// comparable bcrypt.compare cost as the "wrong password" branch — otherwise
// response timing leaks whether an email is registered.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('timing-attack-mitigation', BCRYPT_COST);

function setAuthCookie(res, user) {
  const token = jwt.sign(
    { sub: user.id, email: user.email, tokenVersion: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: '7d', algorithm: 'HS256' }
  );
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE,
  });
}

function clearAuthCookie(res) {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

function sanitize(user) {
  const { passwordHash, tokenVersion, ...rest } = user;
  return { ...rest, access: getAccess(user), isAdmin: isAdmin(user) };
}

function validatePassword(password) {
  if (!password || password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > MAX_PASSWORD_LENGTH) return `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer`;
  return null;
}

// A failed email must never fail the request that triggered it: the account
// (or reset token) already exists, and the user can ask for another email.
async function sendVerification(user) {
  try {
    const token = await issueAuthToken(user.id, VERIFY_EMAIL);
    await sendVerificationEmail(user.email, token);
  } catch (err) {
    console.error(err);
  }
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // Only failed signup/login attempts count against the quota — otherwise a
  // normal signup -> login -> logout -> login cycle (or a shared office/NAT
  // IP with several legitimate users) burns through the budget and locks
  // out real credentials with a 429 that looks like a login failure.
  skipSuccessfulRequests: true,
  skip: () => process.env.NODE_ENV === 'test',
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  store: createRateLimitStore('auth:'),
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
  },
});

// Unlike authLimiter this counts every request: these endpoints succeed by
// design (to avoid leaking which emails exist) and each one can send mail.
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  store: createRateLimitStore('email:'),
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests. Please wait a few minutes and try again.' });
  },
});

router.post('/signup', authLimiter, asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: name || null, trialEndsAt: newTrialEnd() },
  });
  await sendVerification(user);

  setAuthCookie(res, user);
  res.status(201).json(sanitize(user));
}));

router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_PASSWORD_HASH);
  if (!user || !valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  setAuthCookie(res, user);
  res.json(sanitize(user));
}));

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  res.json(sanitize(user));
}));

router.post('/verify-email', emailLimiter, asyncHandler(async (req, res) => {
  const record = await findValidAuthToken(req.body.token, VERIFY_EMAIL);
  if (!record) {
    return res.status(400).json({ error: 'This verification link is invalid or has expired' });
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.authToken.delete({ where: { id: record.id } }),
  ]);
  res.json({ message: 'Email verified' });
}));

router.post('/resend-verification', requireAuth, emailLimiter, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user.emailVerifiedAt) {
    await sendVerification(user);
  }
  res.json({ message: 'Verification email sent' });
}));

router.post('/forgot-password', emailLimiter, asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'A valid email is required' });
  }

  // Same response whether or not the email is registered, and the email is
  // sent without awaiting it, so neither the body nor the response time
  // reveals which addresses have accounts.
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    issueAuthToken(user.id, RESET_PASSWORD)
      .then((token) => sendPasswordResetEmail(user.email, token))
      .catch((err) => console.error(err));
  }
  res.json({ message: 'If an account exists for that email, a reset link has been sent' });
}));

router.post('/reset-password', emailLimiter, asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  const record = await findValidAuthToken(token, RESET_PASSWORD);
  if (!record) {
    return res.status(400).json({ error: 'This reset link is invalid or has expired' });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        // Bumping tokenVersion signs out every existing session, so whoever
        // knew the old password loses access.
        tokenVersion: { increment: 1 },
        // Opening the emailed link proves they own the inbox.
        emailVerifiedAt: user.emailVerifiedAt || new Date(),
      },
    }),
    prisma.authToken.deleteMany({ where: { userId: record.userId, type: RESET_PASSWORD } }),
  ]);
  res.json({ message: 'Password updated' });
}));

export default router;
