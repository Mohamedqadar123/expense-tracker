import { Router } from 'express';
import prisma from '../prismaClient.js';
import { parseDateRange } from '../utils/dateRange.js';

const router = Router();

router.get('/', async (req, res) => {
  const range = parseDateRange(req.query);
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user.id, ...(range ? { date: range } : {}) },
    orderBy: { date: 'desc' },
  });
  res.json(transactions);
});

router.post('/', async (req, res) => {
  const { description, amount, type, category } = req.body;
  const transaction = await prisma.transaction.create({
    data: { description, amount, type, category, userId: req.user.id },
  });
  res.status(201).json(transaction);
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { description, amount, type, category } = req.body;

  const existing = await prisma.transaction.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Transaction not found' });

  const transaction = await prisma.transaction.update({
    where: { id },
    data: { description, amount, type, category },
  });
  res.json(transaction);
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.transaction.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Transaction not found' });

  await prisma.transaction.delete({ where: { id } });
  res.status(204).end();
});

export default router;
