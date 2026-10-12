import { getAccess } from '../services/subscription.js';

// Admins are the accounts listed in ADMIN_EMAILS (comma-separated). The email
// must also be verified: otherwise anyone could sign up with a listed address
// that hasn't registered yet and get the admin dashboard.
export function isAdmin(user) {
  if (!user?.emailVerifiedAt) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(user.email.toLowerCase());
}

// What a user may use right now. Admins run the app, so they are never asked
// to pay: they get every feature on an "admin" plan that never ends.
export function getUserAccess(user, now = new Date()) {
  const access = getAccess(user, now);
  if (!isAdmin(user)) return access;
  return { ...access, plan: 'admin', hasAccess: true, hasFinanceAI: true, cancelled: false };
}
