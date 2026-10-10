// Must run after requireAuth, which resolves req.user.access. Finance AI is
// only included in the Pro plan (and the free trial).
export default function requirePro(req, res, next) {
  if (!req.user?.access?.hasFinanceAI) {
    return res.status(402).json({
      error: 'Finance AI is part of the Pro plan. Upgrade to Pro to use it.',
      code: 'PRO_REQUIRED',
    });
  }
  next();
}
