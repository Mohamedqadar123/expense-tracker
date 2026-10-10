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
