// 'other income' rather than 'other': 'other' is already an expense category.
export const INCOME_CATEGORIES = ['salary', 'commission', 'bonus', 'incentives', 'loan', 'other income'];

export function isIncomeCategory(category) {
  return INCOME_CATEGORIES.some((c) => c.toLowerCase() === String(category || '').toLowerCase());
}
