import { useTranslation } from 'react-i18next'
import { BUDGET_STATUS_LABEL } from '../../utils/budgetStatus'
import { formatCurrency, formatDate } from '../../utils/format'

function BudgetPerformanceTable({ budgets }) {
  const { t } = useTranslation();

  return (
    <div className="section-card">
      <h2>{t('budgets.performance')}</h2>
      {budgets.length === 0 ? (
        <p className="list-empty">{t('budgets.emptyReport')}</p>
      ) : (
        <ul className="budget-list">
          {budgets.map(b => (
            <li key={b.id}>
              <div className="budget-row-header">
                <div>
                  <span className="budget-name">{b.name}</span>
                  <span className="budget-meta"> · {b.category} · {t(`frequencies.${b.period}`)}</span>
                </div>
                <span className={`budget-status-label status-${b.status}`}>
                  {BUDGET_STATUS_LABEL[b.status]}
                </span>
              </div>
              <div className="budget-amounts">
                <span>{t('budgets.spentOf', { spent: formatCurrency(b.spent), amount: formatCurrency(b.amount) })}</span>
                <span>{t('budgets.remaining', { remaining: formatCurrency(Math.max(b.remaining, 0)) })}</span>
                <span>{b.percentUsed.toFixed(0)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-bar-fill ${b.status}`}
                  style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                />
              </div>
              <p className="budget-dates">
                {formatDate(b.startDate)} – {formatDate(b.endDate)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BudgetPerformanceTable
