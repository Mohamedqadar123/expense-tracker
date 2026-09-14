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
import requireAuth from './middleware/requireAuth.js';

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
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
  },
});

app.use('/api/auth', authRouter);
app.use('/api/transactions', requireAuth, apiLimiter, transactionsRouter);
app.use('/api/dashboard', requireAuth, apiLimiter, dashboardRouter);
app.use('/api/budgets', requireAuth, apiLimiter, budgetsRouter);
app.use('/api/goals', requireAuth, apiLimiter, goalsRouter);
app.use('/api/reports', requireAuth, apiLimiter, reportsRouter);
app.use('/api/recurring-transactions', requireAuth, apiLimiter, recurringTransactionsRouter);
app.use('/api/ai', requireAuth, apiLimiter, aiRouter);

// Final safety net: never leak stack traces to the client, regardless of
// whether individual routes remembered to catch their own errors.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

export default app;
