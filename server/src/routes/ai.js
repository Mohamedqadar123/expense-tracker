import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import prisma from '../prismaClient.js';
import { buildFinancialSummary } from '../services/financialAnalysisService.js';
import { askFinancialQuestion, AiServiceError } from '../services/anthropicClient.js';
import { MAX_QUESTION_LENGTH, CONVERSATION_CONTEXT_LIMIT } from '../constants/ai.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = Router();

function validateAskInput({ question }) {
  if (!question || typeof question !== 'string' || !question.trim()) {
    return 'question is required';
  }
  if (question.trim().length > MAX_QUESTION_LENGTH) {
    return `question must be ${MAX_QUESTION_LENGTH} characters or fewer`;
  }
  return null;
}

const askLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user.id),
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many questions. Please wait a few minutes before asking again.' });
  },
});

router.get('/messages', asyncHandler(async (req, res) => {
  const messages = await prisma.aiMessage.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'asc' },
  });
  res.json(messages);
}));

router.post('/messages', askLimiter, asyncHandler(async (req, res) => {
  const error = validateAskInput(req.body);
  if (error) return res.status(400).json({ error });

  const question = req.body.question.trim();
  const userId = req.user.id;

  try {
    const [summary, historyRows] = await Promise.all([
      buildFinancialSummary(prisma, userId),
      prisma.aiMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: CONVERSATION_CONTEXT_LIMIT,
      }),
    ]);
    const history = historyRows.reverse().map((m) => ({ role: m.role, content: m.content }));

    const answer = await askFinancialQuestion({ summary, history, question });

    const [userMessage, assistantMessage] = await prisma.$transaction([
      prisma.aiMessage.create({ data: { userId, role: 'user', content: question } }),
      prisma.aiMessage.create({ data: { userId, role: 'assistant', content: answer } }),
    ]);

    res.status(201).json({ userMessage, assistantMessage });
  } catch (err) {
    if (err instanceof AiServiceError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to process your question' });
  }
}));

router.delete('/messages', asyncHandler(async (req, res) => {
  await prisma.aiMessage.deleteMany({ where: { userId: req.user.id } });
  res.status(204).end();
}));

export default router;
