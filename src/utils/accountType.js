// An account is stored as a name and a starting balance only; it has no
// type of its own. The kind shown on its card is read from the name, which
// is how people already tell their accounts apart ("Salam Bank", "EVC Plus",
// "Cash"). It only chooses an icon and a label, never anything about money.
const MOBILE_MONEY = ['evc', 'zaad', 'sahal', 'edahab', 'e-dahab', 'mpesa', 'm-pesa', 'mobile', 'wallet'];

export function getAccountType(name) {
  const lower = String(name || '').toLowerCase();
  if (MOBILE_MONEY.some((word) => lower.includes(word))) return 'mobileMoney';
  if (lower.includes('bank')) return 'bank';
  if (lower.includes('cash')) return 'cash';
  return 'other';
}
