import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import transactionsRouter from './routes/transactions.js';
import dashboardRouter from './routes/dashboard.js';
import budgetsRouter from './routes/budgets.js';
import goalsRouter from './routes/goals.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/transactions', transactionsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/goals', goalsRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
