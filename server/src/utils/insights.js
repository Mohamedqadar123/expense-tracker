export function buildInsights({ summary, spendingByCategory, monthlySpendingTrend }) {
  const insights = [];
  let nextId = 1;
  const push = (type, message, tone) => insights.push({ id: nextId++, type, message, tone });

  if (summary.expenses === 0 && spendingByCategory.length === 0) {
    push('empty', 'No expenses recorded for this period yet.', 'neutral');
  }

  if (spendingByCategory.length > 0) {
    const top = spendingByCategory[0];
    push(
      'top-category',
      `Your top spending category this period is ${top.category} at $${top.amount.toFixed(2)}.`,
      'neutral'
    );
  }

  if (monthlySpendingTrend.length >= 2) {
    const current = monthlySpendingTrend[monthlySpendingTrend.length - 1];
    const previous = monthlySpendingTrend[monthlySpendingTrend.length - 2];
    if (previous.amount > 0) {
      const change = ((current.amount - previous.amount) / previous.amount) * 100;
      if (Math.abs(change) >= 1) {
        const direction = change > 0 ? 'up' : 'down';
        push(
          'trend',
          `Monthly spending is ${direction} ${Math.abs(change).toFixed(0)}% compared to last month.`,
          change > 0 ? 'warning' : 'positive'
        );
      }
    }
  }

  if (summary.savingsRate === null) {
    push('savings-rate', "No income recorded this period, so savings rate can't be calculated.", 'neutral');
  } else if (summary.savingsRate < 0) {
    push('savings-rate', "You're spending more than you earn this period.", 'negative');
  } else if (summary.savingsRate >= 20) {
    push('savings-rate', `Great job — you're saving ${summary.savingsRate.toFixed(0)}% of your income this period.`, 'positive');
  } else {
    push('savings-rate', `You're saving ${summary.savingsRate.toFixed(0)}% of your income this period.`, 'neutral');
  }

  return insights;
}
