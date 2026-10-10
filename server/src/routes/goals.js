import { Router } from 'express';
import prisma from '../prismaClient.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { ensureAccountName, SAVINGS_CATEGORY } from '../utils/accounts.js';

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

// A goal's saved amount is money set aside from one of the user's accounts.
// Whenever it changes, the difference is recorded as a transaction on that
// account: a debit when money is put into the goal, a credit when it is
// taken back out. Returns the operations to run in the same database
// transaction as the goal change (none if no money moved), so the goal and
// the account can never disagree. The create is deliberately not awaited
// here: awaiting it would run it on its own, outside that transaction.
async function savingsTransferOps(userId, goalName, delta, requestedAccount) {
  if (!delta) return [];
  const account = await ensureAccountName(prisma, userId, requestedAccount);
  return [
    prisma.transaction.create({
      data: {
        userId,
        account,
        amount: Math.abs(delta),
        type: delta > 0 ? 'expense' : 'income',
        category: SAVINGS_CATEGORY,
        description: delta > 0 ? `Saved to goal: ${goalName}` : `Withdrawn from goal: ${goalName}`,
      },
    }),
  ];
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

  const { name, targetAmount, savedAmount, targetDate, account } = req.body;
  const transferOps = await savingsTransferOps(req.user.id, name, savedAmount ?? 0, account);
  const createGoal = prisma.savingsGoal.create({
    data: {
      name,
      targetAmount,
      savedAmount: savedAmount ?? 0,
      targetDate: targetDate ? new Date(targetDate) : null,
      userId: req.user.id,
    },
  });
  const [goal] = await prisma.$transaction([createGoal, ...transferOps]);
  res.status(201).json(goal);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid savings goal id' });
  const error = validateGoalInput(req.body);
  if (error) return res.status(400).json({ error });

  const existing = await prisma.savingsGoal.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Savings goal not found' });

  const { name, targetAmount, savedAmount, targetDate, account } = req.body;
  const transferOps = await savingsTransferOps(req.user.id, name, (savedAmount ?? 0) - existing.savedAmount, account);
  const updateGoal = prisma.savingsGoal.updateMany({
    where: { id, userId: req.user.id },
    data: {
      name,
      targetAmount,
      savedAmount: savedAmount ?? 0,
      targetDate: targetDate ? new Date(targetDate) : targetDate,
    },
  });
  const [result] = await prisma.$transaction([updateGoal, ...transferOps]);
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
