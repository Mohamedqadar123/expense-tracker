import { useState, useEffect } from 'react'
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../../api/budgets'
import BudgetForm from './BudgetForm.jsx'
import { BUDGET_STATUS_LABEL } from '../../utils/budgetStatus'

function BudgetsSection() {
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    getBudgets()
      .then(setBudgets)
      .catch(() => setError('Failed to load budgets'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    getBudgets()
      .then(setBudgets)
      .catch(() => setError('Failed to load budgets'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreate = async (data) => {
    await createBudget(data);
    load();
  };

  const handleUpdate = async (id, data) => {
    await updateBudget(id, data);
    setEditingId(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    await deleteBudget(id);
    load();
  };

  return (
    <div className="section-card">
      <h2>Budget Progress</h2>
      {isLoading ? (
        <p className="list-empty">Loading budgets...</p>
      ) : error ? (
        <div className="dashboard-error">
          <p>{error}</p>
          <button onClick={load}>Retry</button>
        </div>
      ) : (
        <>
          {budgets.length === 0 ? (
            <p className="list-empty">No budgets yet — add one below.</p>
          ) : (
            <ul className="budget-list">
              {budgets.map(b => (
                <li key={b.id}>
                  {editingId === b.id ? (
                    <BudgetForm
                      initialValues={b}
                      onSubmit={(data) => handleUpdate(b.id, data)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
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
                      <div className="budget-actions">
                        <button onClick={() => setEditingId(b.id)}>Edit</button>
                        <button onClick={() => handleDelete(b.id)}>Delete</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          <h3 className="section-subheading">Add Budget</h3>
          <BudgetForm onSubmit={handleCreate} />
        </>
      )}
    </div>
  );
}

export default BudgetsSection
