import { Router } from 'express';
import prisma from '../prismaClient.js';
import { parseDateRange } from '../utils/dateRange.js';

const router = Router();

router.get('/', async (req, res) => {
  const range = parseDateRange(req.query);
  const transactions = await prisma.transaction.findMany({
    where: range ? { date: range } : undefined,
    orderBy: { date: 'desc' },
  });
  res.json(transactions);
});

router.post('/', async (req, res) => {
  const { description, amount, type, category } = req.body;
  const transaction = await prisma.transaction.create({
    data: { description, amount, type, category },
  });
  res.status(201).json(transaction);
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { description, amount, type, category } = req.body;
  try {
    const transaction = await prisma.transaction.update({
      where: { id },
      data: { description, amount, type, category },
    });
    res.json(transaction);
  } catch {
    res.status(404).json({ error: 'Transaction not found' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.transaction.delete({ where: { id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Transaction not found' });
  }
});

export default router;
