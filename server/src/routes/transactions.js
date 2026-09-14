import { Router } from 'express';
import prisma from '../prismaClient.js';
import { parsePartialDateRange } from '../utils/dateRange.js';
import { isIncomeCategory } from '../constants/incomeCategories.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = Router();

const SORT_OPTIONS = ['newest', 'oldest', 'amount_desc', 'amount_asc'];
const SORT_MAP = {
  newest: { date: 'desc' },
  oldest: { date: 'asc' },
  amount_desc: { amount: 'desc' },
  amount_asc: { amount: 'asc' },
};
const MAX_LIMIT = 100;

function validateTransactionQuery(query) {
  const { type, sort, page, limit, minAmount, maxAmount, startDate, endDate } = query;

  if (type !== undefined && !['income', 'expense'].includes(String(type).toLowerCase())) {
    return 'type must be one of: income, expense';
  }
  if (sort !== undefined && !SORT_OPTIONS.includes(sort)) {
    return `sort must be one of: ${SORT_OPTIONS.join(', ')}`;
  }
  if (page !== undefined && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
    return 'page must be a positive integer';
  }
  if (limit !== undefined && (!Number.isInteger(Number(limit)) || Number(limit) < 1)) {
    return 'limit must be a positive integer';
  }
  if (minAmount !== undefined && !Number.isFinite(Number(minAmount))) {
    return 'minAmount must be a number';
  }
  if (maxAmount !== undefined && !Number.isFinite(Number(maxAmount))) {
    return 'maxAmount must be a number';
  }
  if (minAmount !== undefined && maxAmount !== undefined && Number(minAmount) > Number(maxAmount)) {
    return 'minAmount must be less than or equal to maxAmount';
  }
  const { error: dateError } = parsePartialDateRange({ startDate, endDate });
  if (dateError) return dateError;

  return null;
}

function validateTransactionInput({ description, amount, type, category, account }) {
  if (!description || typeof description !== 'string' || !description.trim()) {
    return 'description is required';
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'amount must be a positive number';
  }
  if (!['income', 'expense'].includes(String(type || '').toLowerCase())) {
    return 'type must be one of: income, expense';
  }
  if (!category || typeof category !== 'string' || !category.trim()) {
    return 'category is required';
  }
  const normalizedType = String(type || '').toLowerCase();
  if (isIncomeCategory(category) !== (normalizedType === 'income')) {
    return `category "${category}" is not valid for type "${normalizedType}"`;
  }
  if (account !== undefined && account !== null && typeof account !== 'string') {
    return 'account must be a string';
  }
  return null;
}

router.get('/accounts', asyncHandler(async (req, res) => {
  const rows = await prisma.transaction.findMany({
    where: { userId: req.user.id, account: { not: null } },
    select: { account: true },
    distinct: ['account'],
    orderBy: { account: 'asc' },
  });
  res.json(rows.map((r) => r.account).filter(Boolean));
}));

router.get('/', asyncHandler(async (req, res) => {
  const error = validateTransactionQuery(req.query);
  if (error) return res.status(400).json({ error });

  const { search, type, category, account, startDate, endDate, minAmount, maxAmount } = req.query;
  const { range: dateRange } = parsePartialDateRange({ startDate, endDate });
  const amountRange = (minAmount !== undefined || maxAmount !== undefined) ? {
    ...(minAmount !== undefined ? { gte: Number(minAmount) } : {}),
    ...(maxAmount !== undefined ? { lte: Number(maxAmount) } : {}),
  } : undefined;

  const where = {
    userId: req.user.id,
    ...(type ? { type: String(type).toLowerCase() } : {}),
    ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
    ...(account ? { account: { equals: account, mode: 'insensitive' } } : {}),
    ...(search ? { description: { contains: search, mode: 'insensitive' } } : {}),
    ...(dateRange ? { date: dateRange } : {}),
    ...(amountRange ? { amount: amountRange } : {}),
  };

  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = Math.min(req.query.limit ? Number(req.query.limit) : 25, MAX_LIMIT);
  const orderBy = SORT_MAP[req.query.sort || 'newest'];

  const [total, data] = await prisma.$transaction([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
  ]);

  res.json({
    data,
    total,
    page,
    limit,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  });
}));

router.post('/', asyncHandler(async (req, res) => {
  const error = validateTransactionInput(req.body);
  if (error) return res.status(400).json({ error });

  const { description, amount, type, category, account } = req.body;
  const transaction = await prisma.transaction.create({
    data: {
      description,
      amount,
      type: String(type).toLowerCase(),
      category,
      account: account || null,
      userId: req.user.id,
    },
  });
  res.status(201).json(transaction);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid transaction id' });
  const error = validateTransactionInput(req.body);
  if (error) return res.status(400).json({ error });

  const existing = await prisma.transaction.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Transaction not found' });

  const { description, amount, type, category, account } = req.body;
  const result = await prisma.transaction.updateMany({
    where: { id, userId: req.user.id },
    data: { description, amount, type: String(type).toLowerCase(), category, account: account || null },
  });
  if (result.count === 0) return res.status(404).json({ error: 'Transaction not found' });

  const transaction = await prisma.transaction.findUnique({ where: { id } });
  res.json(transaction);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid transaction id' });

  const existing = await prisma.transaction.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Transaction not found' });

  const result = await prisma.transaction.deleteMany({ where: { id, userId: req.user.id } });
  if (result.count === 0) return res.status(404).json({ error: 'Transaction not found' });

  res.status(204).end();
}));

export default router;
