import { Router } from 'express';
import prisma from '../prismaClient.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = Router();

function validateGoalInput({ name, targetAmount, savedAmount }) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return 'name is required';
  }
  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    return 'targetAmount must be a positive number';
  }
  if (savedAmount !== undefined && savedAmount !== null && (!Number.isFinite(savedAmount) || savedAmount < 0)) {
    return 'savedAmount must be a non-negative number';
  }
  return null;
}

router.get('/', asyncHandler(async (req, res) => {
  const goals = await prisma.savingsGoal.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(goals);
}));

router.post('/', asyncHandler(async (req, res) => {
  const error = validateGoalInput(req.body);
  if (error) return res.status(400).json({ error });

  const { name, targetAmount, savedAmount, targetDate } = req.body;
  const goal = await prisma.savingsGoal.create({
    data: {
      name,
      targetAmount,
      savedAmount: savedAmount ?? 0,
      targetDate: targetDate ? new Date(targetDate) : null,
      userId: req.user.id,
    },
  });
  res.status(201).json(goal);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid savings goal id' });
  const error = validateGoalInput(req.body);
  if (error) return res.status(400).json({ error });

  const existing = await prisma.savingsGoal.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Savings goal not found' });

  const { name, targetAmount, savedAmount, targetDate } = req.body;
  const result = await prisma.savingsGoal.updateMany({
    where: { id, userId: req.user.id },
    data: {
      name,
      targetAmount,
      savedAmount: savedAmount ?? 0,
      targetDate: targetDate ? new Date(targetDate) : targetDate,
    },
  });
  if (result.count === 0) return res.status(404).json({ error: 'Savings goal not found' });

  const goal = await prisma.savingsGoal.findUnique({ where: { id } });
  res.json(goal);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid savings goal id' });

  const existing = await prisma.savingsGoal.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Savings goal not found' });

  const result = await prisma.savingsGoal.deleteMany({ where: { id, userId: req.user.id } });
  if (result.count === 0) return res.status(404).json({ error: 'Savings goal not found' });

  res.status(204).end();
}));

export default router;
