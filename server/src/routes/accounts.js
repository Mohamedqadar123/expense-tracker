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

  // Transactions point at their account by name, so a rename has to be
  // applied to them too or they would silently fall out of the balance.
  const newName = name.trim();
  const usesOldName = { userId: req.user.id, account: { equals: existing.name, mode: 'insensitive' } };
  await prisma.$transaction([
    prisma.account.updateMany({
      where: { id, userId: req.user.id },
      data: { name: newName, startingBalance: startingBalance ?? 0 },
    }),
    prisma.transaction.updateMany({ where: usesOldName, data: { account: newName } }),
    prisma.recurringTransaction.updateMany({ where: usesOldName, data: { account: newName } }),
  ]);

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

  // Deleting an account that money has moved through would leave those
  // transactions belonging to nothing.
  const usesAccount = { userId: req.user.id, account: { equals: existing.name, mode: 'insensitive' } };
  const [transactionCount, recurringCount, accountCount] = await Promise.all([
    prisma.transaction.count({ where: usesAccount }),
    prisma.recurringTransaction.count({ where: usesAccount }),
    prisma.account.count({ where: { userId: req.user.id } }),
  ]);
  if (transactionCount > 0 || recurringCount > 0) {
    return res.status(409).json({
      error: `"${existing.name}" has transactions, so it can't be deleted. Move or delete them first.`,
    });
  }
  if (accountCount <= 1) {
    return res.status(409).json({ error: 'You need at least one account to record transactions.' });
  }

  const result = await prisma.account.deleteMany({ where: { id, userId: req.user.id } });
  if (result.count === 0) return res.status(404).json({ error: 'Account not found' });

  res.status(204).end();
}));

export default router;
