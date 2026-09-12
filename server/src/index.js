import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.js';
import transactionsRouter from './routes/transactions.js';
import dashboardRouter from './routes/dashboard.js';
import budgetsRouter from './routes/budgets.js';
import goalsRouter from './routes/goals.js';
import reportsRouter from './routes/reports.js';
import requireAuth from './middleware/requireAuth.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/transactions', requireAuth, transactionsRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);
app.use('/api/budgets', requireAuth, budgetsRouter);
app.use('/api/goals', requireAuth, goalsRouter);
app.use('/api/reports', requireAuth, reportsRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
