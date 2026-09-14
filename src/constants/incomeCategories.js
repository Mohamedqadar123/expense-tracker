export const INCOME_CATEGORIES = ['salary'];

export function isIncomeCategory(category) {
  return INCOME_CATEGORIES.some((c) => c.toLowerCase() === String(category || '').toLowerCase());
}
