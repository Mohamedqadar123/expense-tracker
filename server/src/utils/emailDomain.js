import { resolveMx } from 'node:dns/promises';

const LOOKUP_TIMEOUT_MS = 4000;

// DNS answers that mean "this domain definitely has no mail servers".
const NO_MAIL_CODES = new Set(['ENOTFOUND', 'ENODATA']);

// First of two checks that an email address is real, before anything is sent
// to it: the part after the @ must be a domain that actually accepts mail
// (gmail.com does; a typo such as gmial.con, or a made-up domain, does not).
//
// This cannot tell whether the specific mailbox exists. Providers such as
// Gmail, Yahoo and iCloud deliberately do not answer that question to
// outsiders, so the mailbox itself is proven by the second check: the person
// has to open the link we email them before their account is created.
//
// Returns an error message, or null when the domain can receive mail. A DNS
// failure that isn't a clear "no" (timeout, resolver down) lets the address
// through, since the emailed link still has to be opened.
export async function getEmailDomainError(email, lookupMx = resolveMx) {
  const domain = String(email).split('@').pop().toLowerCase();

  try {
    const records = await Promise.race([
      lookupMx(domain),
      new Promise((_, reject) => {
        // unref: a pending timeout must never keep the process alive.
        setTimeout(() => reject(Object.assign(new Error('DNS lookup timed out'), { code: 'ETIMEOUT' })), LOOKUP_TIMEOUT_MS).unref();
      }),
    ]);
    // A single record with an empty exchange is how a domain declares that it
    // accepts no mail at all (RFC 7505).
    const acceptsMail = records.some((record) => record.exchange && record.exchange !== '.');
    return acceptsMail ? null : domainError(domain);
  } catch (err) {
    return NO_MAIL_CODES.has(err.code) ? domainError(domain) : null;
  }
}

function domainError(domain) {
  return `"${domain}" can't receive email. Check the address for typos and use a real email account.`;
}
