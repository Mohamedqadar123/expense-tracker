import { BUDGET_STATUS_LABEL } from '../../utils/budgetStatus'

function BudgetPerformanceTable({ budgets }) {
  return (
    <div className="section-card">
      <h2>Budget Performance</h2>
      {budgets.length === 0 ? (
        <p className="list-empty">No budgets to report on.</p>
      ) : (
        <ul className="budget-list">
          {budgets.map(b => (
            <li key={b.id}>
              <div className="budget-row-header">
                <div>
                  <span className="budget-name">{b.name}</span>
                  <span className="budget-meta"> · {b.category} · {b.period}</span>
                </div>
                <span className={`budget-status-label status-${b.status}`}>
                  {BUDGET_STATUS_LABEL[b.status]}
                </span>
              </div>
              <div className="budget-amounts">
                <span>${b.spent.toFixed(2)} spent of ${b.amount.toFixed(2)}</span>
                <span>${Math.max(b.remaining, 0).toFixed(2)} remaining</span>
                <span>{b.percentUsed.toFixed(0)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-bar-fill ${b.status}`}
                  style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                />
              </div>
              <p className="budget-dates">
                {b.startDate.slice(0, 10)} – {b.endDate.slice(0, 10)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BudgetPerformanceTable
