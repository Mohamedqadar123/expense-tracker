// Must run after requireAuth, which resolves req.user.access. Blocks accounts
// whose trial has ended and that have no paid plan.
export default function requireSubscription(req, res, next) {
  if (!req.user?.access?.hasAccess) {
    return res.status(402).json({
      error: 'Your free trial has ended. Choose a plan to keep using Finance Tracker.',
      code: 'SUBSCRIPTION_REQUIRED',
    });
  }
  next();
}
