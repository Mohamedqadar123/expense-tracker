import { Router } from 'express';
import prisma from '../prismaClient.js';
import { RECURRING_TYPES, RECURRING_FREQUENCIES } from '../constants/recurringTransactions.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = Router();

function validateRecurringTransactionInput({ description, amount, type, category, account, frequency, startDate, endDate, nextExecutionDate }) {
  if (!description || typeof description !== 'string' || !description.trim()) {
    return 'description is required';
  }
  if (!(amount > 0)) {
    return 'amount must be a positive number';
  }
  const canonicalType = RECURRING_TYPES.find((t) => t === String(type || '').toLowerCase());
  if (!canonicalType) {
    return `type must be one of: ${RECURRING_TYPES.join(', ')}`;
  }
  if (!category || typeof category !== 'string' || !category.trim()) {
    return 'category is required';
  }
  if (account !== undefined && account !== null && typeof account !== 'string') {
    return 'account must be a string';
  }
  const canonicalFrequency = RECURRING_FREQUENCIES.find((f) => f === String(frequency || '').toLowerCase());
  if (!canonicalFrequency) {
    return `frequency must be one of: ${RECURRING_FREQUENCIES.join(', ')}`;
  }
  const start = new Date(startDate);
  if (!startDate || isNaN(start)) {
    return 'startDate is required and must be a valid date';
  }
  if (endDate) {
    const end = new Date(endDate);
    if (isNaN(end)) return 'endDate must be a valid date';
    if (end < start) return 'endDate must be on or after startDate';
  }
  if (nextExecutionDate) {
    const next = new Date(nextExecutionDate);
    if (isNaN(next)) return 'nextExecutionDate must be a valid date';
    if (next < start) return 'nextExecutionDate cannot be before startDate';
  }
  return null;
}

router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const recurringTransactions = await prisma.recurringTransaction.findMany({
    where: { userId: req.user.id, ...(status ? { status } : {}) },
    orderBy: { nextExecutionDate: 'asc' },
  });
  res.json(recurringTransactions);
}));

router.post('/', asyncHandler(async (req, res) => {
  const error = validateRecurringTransactionInput(req.body);
  if (error) return res.status(400).json({ error });

  const { description, amount, type, category, account, frequency, startDate, endDate, nextExecutionDate } = req.body;
  const start = new Date(startDate);

  const recurringTransaction = await prisma.recurringTransaction.create({
    data: {
      description,
      amount: Number(amount),
      type: type.toLowerCase(),
      category,
      account: account || null,
      frequency: frequency.toLowerCase(),
      status: 'active',
      startDate: start,
      endDate: endDate ? new Date(endDate) : null,
      nextExecutionDate: nextExecutionDate ? new Date(nextExecutionDate) : start,
      userId: req.user.id,
    },
  });
  res.status(201).json(recurringTransaction);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid recurring transaction id' });
  const error = validateRecurringTransactionInput(req.body);
  if (error) return res.status(400).json({ error });

  const existing = await prisma.recurringTransaction.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Recurring transaction not found' });

  const { description, amount, type, category, account, frequency, startDate, endDate, nextExecutionDate } = req.body;
  const start = new Date(startDate);

  const result = await prisma.recurringTransaction.updateMany({
    where: { id, userId: req.user.id },
    data: {
      description,
      amount: Number(amount),
      type: type.toLowerCase(),
      category,
      account: account || null,
      frequency: frequency.toLowerCase(),
      startDate: start,
      endDate: endDate ? new Date(endDate) : null,
      // Preserve existing progress unless the caller explicitly overrides it —
      // editing other fields (amount, category, ...) must not silently rewind
      // nextExecutionDate back to startDate and re-trigger already-generated occurrences.
      nextExecutionDate: nextExecutionDate ? new Date(nextExecutionDate) : existing.nextExecutionDate,
    },
  });
  if (result.count === 0) return res.status(404).json({ error: 'Recurring transaction not found' });

  const recurringTransaction = await prisma.recurringTransaction.findUnique({ where: { id } });
  res.json(recurringTransaction);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid recurring transaction id' });

  const existing = await prisma.recurringTransaction.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Recurring transaction not found' });

  const result = await prisma.recurringTransaction.deleteMany({ where: { id, userId: req.user.id } });
  if (result.count === 0) return res.status(404).json({ error: 'Recurring transaction not found' });

  res.status(204).end();
}));

router.patch('/:id/pause', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid recurring transaction id' });

  const existing = await prisma.recurringTransaction.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Recurring transaction not found' });

  const result = await prisma.recurringTransaction.updateMany({
    where: { id, userId: req.user.id },
    data: { status: 'paused' },
  });
  if (result.count === 0) return res.status(404).json({ error: 'Recurring transaction not found' });

  const recurringTransaction = await prisma.recurringTransaction.findUnique({ where: { id } });
  res.json(recurringTransaction);
}));

router.patch('/:id/resume', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid recurring transaction id' });

  const existing = await prisma.recurringTransaction.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Recurring transaction not found' });

  const result = await prisma.recurringTransaction.updateMany({
    where: { id, userId: req.user.id },
    data: { status: 'active' },
  });
  if (result.count === 0) return res.status(404).json({ error: 'Recurring transaction not found' });

  const recurringTransaction = await prisma.recurringTransaction.findUnique({ where: { id } });
  res.json(recurringTransaction);
}));

router.get('/:id/history', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid recurring transaction id' });

  const existing = await prisma.recurringTransaction.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Recurring transaction not found' });

  const history = await prisma.recurringTransactionLog.findMany({
    where: { recurringTransactionId: id },
    orderBy: { occurrenceDate: 'desc' },
    include: { transaction: true },
  });
  res.json(history);
}));

export default router;
