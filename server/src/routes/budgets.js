import { Router } from 'express';
import prisma from '../prismaClient.js';
import { getBudgetProgress } from '../utils/budgetProgress.js';
import { BUDGET_CATEGORIES, BUDGET_PERIODS } from '../constants/budgetCategories.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = Router();

function validateBudgetInput({ name, category, amount, period, startDate, endDate }) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return 'name is required';
  }
  const canonicalCategory = BUDGET_CATEGORIES.find(
    (c) => c.toLowerCase() === String(category || '').toLowerCase()
  );
  if (!canonicalCategory) {
    return `category must be one of: ${BUDGET_CATEGORIES.join(', ')}`;
  }
  if (!(amount > 0)) {
    return 'amount must be a positive number';
  }
  if (!BUDGET_PERIODS.includes(period)) {
    return `period must be one of: ${BUDGET_PERIODS.join(', ')}`;
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (!startDate || !endDate || isNaN(start) || isNaN(end)) {
    return 'startDate and endDate are required valid dates';
  }
  if (start >= end) {
    return 'startDate must be before endDate';
  }
  return null;
}

router.get('/', asyncHandler(async (req, res) => {
  const budgets = await getBudgetProgress(prisma, req.user.id);
  res.json(budgets);
}));

router.post('/', asyncHandler(async (req, res) => {
  const error = validateBudgetInput(req.body);
  if (error) return res.status(400).json({ error });

  const { name, category, amount, period, startDate, endDate } = req.body;
  const canonicalCategory = BUDGET_CATEGORIES.find((c) => c.toLowerCase() === category.toLowerCase());

  const budget = await prisma.budget.create({
    data: {
      name,
      category: canonicalCategory,
      amount,
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      userId: req.user.id,
    },
  });
  res.status(201).json(budget);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid budget id' });
  const error = validateBudgetInput(req.body);
  if (error) return res.status(400).json({ error });

  const existing = await prisma.budget.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Budget not found' });

  const { name, category, amount, period, startDate, endDate } = req.body;
  const canonicalCategory = BUDGET_CATEGORIES.find((c) => c.toLowerCase() === category.toLowerCase());

  const result = await prisma.budget.updateMany({
    where: { id, userId: req.user.id },
    data: {
      name,
      category: canonicalCategory,
      amount,
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });
  if (result.count === 0) return res.status(404).json({ error: 'Budget not found' });

  const budget = await prisma.budget.findUnique({ where: { id } });
  res.json(budget);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid budget id' });

  const existing = await prisma.budget.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Budget not found' });

  const result = await prisma.budget.deleteMany({ where: { id, userId: req.user.id } });
  if (result.count === 0) return res.status(404).json({ error: 'Budget not found' });

  res.status(204).end();
}));

export default router;
