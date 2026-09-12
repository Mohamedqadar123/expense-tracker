import { Router } from 'express';
import prisma from '../prismaClient.js';
import { getBudgetProgress } from '../utils/budgetProgress.js';

const router = Router();

router.get('/', async (req, res) => {
  const budgets = await getBudgetProgress(prisma);
  res.json(budgets);
});

router.post('/', async (req, res) => {
  const { category, monthlyLimit } = req.body;
  if (!category || typeof category !== 'string' || !(monthlyLimit > 0)) {
    return res.status(400).json({ error: 'category and a positive monthlyLimit are required' });
  }
  try {
    const budget = await prisma.budget.create({ data: { category, monthlyLimit } });
    res.status(201).json(budget);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A budget already exists for this category' });
    }
    throw err;
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { category, monthlyLimit } = req.body;
  try {
    const budget = await prisma.budget.update({
      where: { id },
      data: { category, monthlyLimit },
    });
    res.json(budget);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Budget not found' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'A budget already exists for this category' });
    throw err;
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.budget.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Budget not found' });
    throw err;
  }
});

export default router;
