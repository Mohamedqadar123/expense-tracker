// Must run after requireAuth, which resolves req.user.isAdmin. Answers 404
// rather than 403 so the admin API isn't advertised to ordinary accounts.
export default function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
}
