// Well-known Somali banks and mobile money, offered in every account picker
// so a user can credit or debit one without setting it up first. Choosing
// one that the user doesn't have yet creates it as their account on the
// server the first time money moves through it.
export const PRESET_ACCOUNTS = [
  'Salam Bank',
  'Premier Bank',
  'IBS Bank',
  'Bulsho Bank',
  'My Bank',
  'Dahabshil Bank',
  'EVC Plus',
];

// The presets the user has not already got as an account (matched without
// regard to case, the same way the server matches account names).
export function getUnusedPresetAccounts(accounts) {
  const owned = new Set(accounts.map((account) => account.name.toLowerCase()));
  return PRESET_ACCOUNTS.filter((name) => !owned.has(name.toLowerCase()));
}
