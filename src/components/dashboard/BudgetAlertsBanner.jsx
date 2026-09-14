import { useTranslation } from 'react-i18next'
import { BUDGET_STATUS_TONE } from '../../utils/budgetStatus'

function BudgetAlertsBanner({ budgets }) {
  const { t } = useTranslation();
  const flagged = budgets.filter(b => b.status !== 'normal');
  if (flagged.length === 0) return null;

  return (
    <ul className="insights-list budget-alerts-banner">
      {flagged.map(b => (
        <li key={b.id} className={`insight-${BUDGET_STATUS_TONE[b.status]}`}>
          {b.status === 'exceeded'
            ? t('alerts.overBudget', { name: b.name, spent: b.spent.toFixed(2), amount: b.amount.toFixed(2) })
            : t('alerts.nearBudget', { name: b.name, percent: b.percentUsed.toFixed(0) })}
        </li>
      ))}
    </ul>
  );
}

export default BudgetAlertsBanner
