const NEW_USER_WINDOW_MS = 24 * 60 * 60 * 1000;

// The username is the part of the email before the @ with digits and
// punctuation stripped ("moha.qadar1918@gmail.com" -> "mohaqadar"), so the
// full address is never shown on screen. Works for any email provider and
// keeps letters from any alphabet.
export function getUsername(email) {
  return (email || '').split('@')[0].replace(/[^\p{L}]/gu, '');
}

// "New" means registered within the last 24 hours.
export function isNewUser(createdAt, now = Date.now()) {
  if (!createdAt) return false;
  return now - new Date(createdAt).getTime() < NEW_USER_WINDOW_MS;
}
