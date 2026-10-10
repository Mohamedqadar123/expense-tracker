import 'dotenv/config';
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

// Final safety net: never leak stack traces to the client, regardless of
// whether individual routes remembered to catch their own errors.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

export default app;
