import { BUDGET_STATUS_TONE } from '../../utils/budgetStatus'

function BudgetAlertsBanner({ budgets }) {
  const flagged = budgets.filter(b => b.status !== 'normal');
  if (flagged.length === 0) return null;

  return (
    <ul className="insights-list budget-alerts-banner">
      {flagged.map(b => (
        <li key={b.id} className={`insight-${BUDGET_STATUS_TONE[b.status]}`}>
          {b.status === 'exceeded'
            ? `You're over budget for "${b.name}" ($${b.spent.toFixed(2)} of $${b.amount.toFixed(2)}).`
            : `You've used ${b.percentUsed.toFixed(0)}% of your "${b.name}" budget.`}
        </li>
      ))}
    </ul>
  );
}

export default BudgetAlertsBanner
