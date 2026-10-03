import { Router } from 'express';
import prisma from '../prismaClient.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { getAccountBalances } from '../utils/accountBalances.js';

const router = Router();

function validateAccountInput({ name, startingBalance }) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return 'name is required';
  }
  if (startingBalance !== undefined && startingBalance !== null && !Number.isFinite(startingBalance)) {
    return 'startingBalance must be a number';
  }
  return null;
}

router.get('/', asyncHandler(async (req, res) => {
  const accounts = await getAccountBalances(prisma, req.user.id);
  res.json(accounts);
}));

router.post('/', asyncHandler(async (req, res) => {
  const error = validateAccountInput(req.body);
  if (error) return res.status(400).json({ error });

  const { name, startingBalance } = req.body;
  const existing = await prisma.account.findFirst({
    where: { userId: req.user.id, name: { equals: name.trim(), mode: 'insensitive' } },
  });
  if (existing) return res.status(409).json({ error: `An account named "${name.trim()}" already exists` });

  const account = await prisma.account.create({
    data: { name: name.trim(), startingBalance: startingBalance ?? 0, userId: req.user.id },
  });
  res.status(201).json({ ...account, income: 0, expense: 0, balance: account.startingBalance });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid account id' });
  const error = validateAccountInput(req.body);
  if (error) return res.status(400).json({ error });

  const existing = await prisma.account.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Account not found' });

  const { name, startingBalance } = req.body;
  const nameConflict = await prisma.account.findFirst({
    where: { userId: req.user.id, id: { not: id }, name: { equals: name.trim(), mode: 'insensitive' } },
  });
  if (nameConflict) return res.status(409).json({ error: `An account named "${name.trim()}" already exists` });

  await prisma.account.updateMany({
    where: { id, userId: req.user.id },
    data: { name: name.trim(), startingBalance: startingBalance ?? 0 },
  });

  const [account] = await getAccountBalances(prisma, req.user.id).then((accounts) =>
    accounts.filter((a) => a.id === id)
  );
  res.json(account);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid account id' });

  const existing = await prisma.account.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Account not found' });

  const result = await prisma.account.deleteMany({ where: { id, userId: req.user.id } });
  if (result.count === 0) return res.status(404).json({ error: 'Account not found' });

  res.status(204).end();
}));

export default router;
