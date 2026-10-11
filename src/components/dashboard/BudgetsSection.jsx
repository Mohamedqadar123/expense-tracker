import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../../api/budgets'
import BudgetForm from './BudgetForm.jsx'
import BottomSheet from '../BottomSheet.jsx'
import { formatCurrency, formatDate } from '../../utils/format'
import { useFeedback } from '../../context/useFeedback.js'
import { ListSkeleton } from '../feedback/Skeleton.jsx'
import EmptyState from '../feedback/EmptyState.jsx'
import { loadErrorMessage } from '../../api/config'
import { PlusIcon } from '../icons/Icons.jsx'

// The whole Budgets page: the title with its Add button, the list of budgets
// with their progress, and the dialog for adding or editing one.
function BudgetsSection() {
  const { t } = useTranslation();
  const { confirm, notify } = useFeedback();
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Why an action was refused. Shown above the list, which stays where it is.
  const [actionError, setActionError] = useState(null);
  // The open dialog: { kind: 'add' } or { kind: 'edit', budget }.
  const [dialog, setDialog] = useState(null);

  const load = useCallback(() => {
    return getBudgets()
      .then((list) => {
        setBudgets(list);
        setError(null);
      })
      .catch((err) => setError(loadErrorMessage(err, t('budgets.loadError'))))
      .finally(() => setIsLoading(false));
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  // A new expense changes how much of its budget is spent.
  useEffect(() => {
    window.addEventListener('transaction:created', load);
    return () => window.removeEventListener('transaction:created', load);
  }, [load]);

  const retry = () => {
    setIsLoading(true);
    load();
  };

  const closeDialog = () => setDialog(null);

  const handleCreate = async (data) => {
    await createBudget(data);
    closeDialog();
    load();
    notify(t('feedback.added'));
  };

  const handleUpdate = async (id, data) => {
    await updateBudget(id, data);
    closeDialog();
    load();
    notify(t('feedback.saved'));
  };

  const handleDelete = async (id) => {
    if (!(await confirm(t('budgets.deleteConfirm'), t('common.delete')))) return;
    setActionError(null);
    try {
      await deleteBudget(id);
      load();
      notify(t('feedback.deleted'));
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('budgets.title')}</h1>
          <p className="subtitle">{t('budgets.subtitle')}</p>
        </div>
        <button type="button" className="btn btn-primary page-header-add" onClick={() => setDialog({ kind: 'add' })}>
          <PlusIcon />
          {t('budgets.addBudget')}
        </button>
      </div>

      <div className="section-card">
        <h2>{t('budgets.progress')}</h2>
        {isLoading ? (
          <ListSkeleton label={t('budgets.loading')} />
        ) : error ? (
          <div className="dashboard-error">
            <p>{error}</p>
            <button onClick={retry}>{t('common.retry')}</button>
          </div>
        ) : (
          <>
            {actionError && <p className="auth-error" role="alert">{actionError}</p>}
            {budgets.length === 0 ? (
              <EmptyState icon="bell" message={t('budgets.empty')} />
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
                        {t(`budgets.status.${b.status}`)}
                      </span>
                    </div>
                    <div className="budget-amounts">
                      <span>{t('budgets.spentOf', { spent: formatCurrency(b.spent), amount: formatCurrency(b.amount) })}</span>
                      {/* Past the limit, say by how much rather than "$0.00 remaining" */}
                      {b.remaining < 0 ? (
                        <span className="budget-over">{t('budgets.overBy', { amount: formatCurrency(-b.remaining) })}</span>
                      ) : (
                        <span>{t('budgets.remaining', { remaining: formatCurrency(b.remaining) })}</span>
                      )}
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
                    <div className="row-actions">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDialog({ kind: 'edit', budget: b })}>
                        {t('common.edit')}
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm row-action-delete" onClick={() => handleDelete(b.id)}>
                        {t('common.delete')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <BottomSheet isOpen={dialog?.kind === 'add'} onClose={closeDialog} title={t('budgets.addBudget')}>
        <BudgetForm onSubmit={handleCreate} onCancel={closeDialog} />
      </BottomSheet>

      <BottomSheet isOpen={dialog?.kind === 'edit'} onClose={closeDialog} title={t('budgets.editBudget')}>
        {dialog?.kind === 'edit' && (
          <BudgetForm
            key={dialog.budget.id}
            initialValues={dialog.budget}
            onSubmit={(data) => handleUpdate(dialog.budget.id, data)}
            onCancel={closeDialog}
          />
        )}
      </BottomSheet>
    </>
  );
}

export default BudgetsSection
