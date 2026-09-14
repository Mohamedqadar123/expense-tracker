import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../../api/budgets'
import BudgetForm from './BudgetForm.jsx'
import { BUDGET_STATUS_LABEL } from '../../utils/budgetStatus'

function BudgetsSection() {
  const { t } = useTranslation();
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    getBudgets()
      .then(setBudgets)
      .catch(() => setError(t('budgets.loadError')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    getBudgets()
      .then(setBudgets)
      .catch(() => setError(t('budgets.loadError')))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!window.confirm(t('budgets.deleteConfirm'))) return;
    await deleteBudget(id);
    load();
  };

  return (
    <div className="section-card">
      <h2>{t('budgets.progress')}</h2>
      {isLoading ? (
        <p className="list-empty">{t('budgets.loading')}</p>
      ) : error ? (
        <div className="dashboard-error">
          <p>{error}</p>
          <button onClick={load}>{t('common.retry')}</button>
        </div>
      ) : (
        <>
          {budgets.length === 0 ? (
            <p className="list-empty">{t('budgets.empty')}</p>
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
                          <span className="budget-meta"> · {b.category} · {t(`frequencies.${b.period}`)}</span>
                        </div>
                        <span className={`budget-status-label status-${b.status}`}>
                          {BUDGET_STATUS_LABEL[b.status]}
                        </span>
                      </div>
                      <div className="budget-amounts">
                        <span>{t('budgets.spentOf', { spent: b.spent.toFixed(2), amount: b.amount.toFixed(2) })}</span>
                        <span>{t('budgets.remaining', { remaining: Math.max(b.remaining, 0).toFixed(2) })}</span>
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
                        <button onClick={() => setEditingId(b.id)}>{t('common.edit')}</button>
                        <button onClick={() => handleDelete(b.id)}>{t('common.delete')}</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          <h3 className="section-subheading">{t('budgets.addBudget')}</h3>
          <BudgetForm onSubmit={handleCreate} />
        </>
      )}
    </div>
  );
}

export default BudgetsSection
