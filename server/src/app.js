import 'dotenv/config';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.js';
import transactionsRouter from './routes/transactions.js';
import dashboardRouter from './routes/dashboard.js';
import budgetsRouter from './routes/budgets.js';
import goalsRouter from './routes/goals.js';
import reportsRouter from './routes/reports.js';
import recurringTransactionsRouter from './routes/recurringTransactions.js';
import aiRouter from './routes/ai.js';
import accountsRouter from './routes/accounts.js';
import billingRouter from './routes/billing.js';
import adminRouter from './routes/admin.js';
import requireAuth from './middleware/requireAuth.js';
import requireSubscription from './middleware/requireSubscription.js';
import requirePro from './middleware/requirePro.js';
import requireAdmin from './middleware/requireAdmin.js';
import { createRateLimitStore } from './rateLimitStore.js';

const app = express();

// In production the app runs behind one reverse proxy (Railway's edge), which
// puts the visitor's address in X-Forwarded-For. Trusting exactly that one
// hop makes req.ip the visitor, so the rate limits count each person rather
// than lumping everyone together as the proxy.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  keyGenerator: (req) => (req.user ? String(req.user.id) : ipKeyGenerator(req.ip)),
  store: createRateLimitStore('api:'),
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
  },
});

app.use('/api/auth', authRouter);
// Everything in the app itself needs the free trial or a paid plan; auth and
// billing stay reachable so an expired account can still log in and pay.
const subscribed = [requireAuth, apiLimiter, requireSubscription];

app.use('/api/transactions', subscribed, transactionsRouter);
app.use('/api/dashboard', subscribed, dashboardRouter);
app.use('/api/budgets', subscribed, budgetsRouter);
app.use('/api/goals', subscribed, goalsRouter);
app.use('/api/reports', subscribed, reportsRouter);
app.use('/api/recurring-transactions', subscribed, recurringTransactionsRouter);
app.use('/api/ai', subscribed, requirePro, aiRouter);
app.use('/api/accounts', subscribed, accountsRouter);
// Applies requireAuth per route: /plans is public so the landing page can show pricing.
app.use('/api/billing', billingRouter);
app.use('/api/admin', requireAuth, apiLimiter, requireAdmin, adminRouter);

// Unknown API paths answer as an API would, not with the web app below.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// In production one service serves both the API and the built web app
// (`npm run build` at the repo root writes it to dist/), so they share one
// address and the sign-in cookie works without any cross-site setup. Every
// other GET gets index.html so links such as /verify-email open the app's
// own page. Locally the Vite dev server serves the app instead and dist/
// usually doesn't exist, so this is skipped.
const webAppDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist');
if (existsSync(path.join(webAppDir, 'index.html'))) {
  app.use(express.static(webAppDir, { index: false, maxAge: '1h' }));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(webAppDir, 'index.html'));
  });
}

// Final safety net: never leak stack traces to the client, regardless of
// whether individual routes remembered to catch their own errors.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

export default app;
