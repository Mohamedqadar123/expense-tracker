import { createHash } from 'node:crypto';
import prisma from '../prismaClient.js';

// The free trial is for a person's first registration only. Every email that
// has had a trial leaves a TrialClaim behind, which is never deleted (not even
// with the account), so registering again, after deleting an account or
// being deleted by an admin, does not start a second trial.
//
// Only a SHA-256 fingerprint of the email is stored, never the address
// itself, so a deleted account leaves nothing readable behind.

// Gmail ignores dots in the name, and googlemail.com is the same mailbox.
const GMAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com']);

// Reduces the different ways of writing one mailbox to a single form, so
// john@gmail.com, J.o.h.n@gmail.com, john+trial2@gmail.com and
// john@googlemail.com all count as the same person:
// - letter case and surrounding spaces don't matter;
// - "+anything" before the @ is dropped (most providers deliver
//   name+anything@ to name@);
// - for Gmail, dots in the name are dropped and googlemail.com is gmail.com.
//
// MUST stay identical to the SQL in the add_trial_claims migration, which
// fingerprinted the accounts that existed before this table did.
export function canonicalEmail(email) {
  const normalized = String(email).trim().toLowerCase();
  const at = normalized.indexOf('@');
  if (at === -1) return normalized;
  let local = normalized.slice(0, at).split('+')[0];
  let domain = normalized.slice(at + 1);
  if (GMAIL_DOMAINS.has(domain)) {
    local = local.replaceAll('.', '');
    domain = 'gmail.com';
  }
  return `${local}@${domain}`;
}

export function trialFingerprint(email) {
  return createHash('sha256').update(canonicalEmail(email), 'utf8').digest('hex');
}

// Exceptions to the one-trial rule: emails listed in TRIAL_EXEMPT_EMAILS
// (comma-separated) get a fresh free trial every time they register. This
// gives nothing else: an exempt account is not an admin and pays like anyone
// else once its trial ends. Variants of a listed address count too.
export function isTrialExempt(email) {
  const target = canonicalEmail(email);
  return (process.env.TRIAL_EXEMPT_EMAILS || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .some((entry) => canonicalEmail(entry) === target);
}

export async function hasUsedTrial(email, db = prisma) {
  if (isTrialExempt(email)) return false;
  const claim = await db.trialClaim.findUnique({ where: { emailHash: trialFingerprint(email) } });
  return Boolean(claim);
}

// Records that this email is getting its free trial, and says whether it may.
// Returns false when the email (or a variant of it) already had one. The
// unique emailHash makes this safe against two sign-ups being confirmed at
// the same moment: the database lets exactly one of them insert the claim.
// Run it inside the transaction that creates the user.
export async function claimTrial(tx, email) {
  const { count } = await tx.trialClaim.createMany({
    data: [{ emailHash: trialFingerprint(email) }],
    skipDuplicates: true,
  });
  return count === 1 || isTrialExempt(email);
}
