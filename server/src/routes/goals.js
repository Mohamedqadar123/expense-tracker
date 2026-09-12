import { Router } from 'express';
import prisma from '../prismaClient.js';

const router = Router();

router.get('/', async (req, res) => {
  const goals = await prisma.savingsGoal.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(goals);
});

router.post('/', async (req, res) => {
  const { name, targetAmount, savedAmount, targetDate } = req.body;
  if (!name || typeof name !== 'string' || !(targetAmount > 0)) {
    return res.status(400).json({ error: 'name and a positive targetAmount are required' });
  }
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
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, targetAmount, savedAmount, targetDate } = req.body;

  const existing = await prisma.savingsGoal.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Savings goal not found' });

  const goal = await prisma.savingsGoal.update({
    where: { id },
    data: {
      name,
      targetAmount,
      savedAmount,
      targetDate: targetDate ? new Date(targetDate) : targetDate,
    },
  });
  res.json(goal);
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.savingsGoal.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Savings goal not found' });

  await prisma.savingsGoal.delete({ where: { id } });
  res.status(204).end();
});

export default router;
