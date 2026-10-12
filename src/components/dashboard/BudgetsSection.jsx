import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../../api/budgets'
import BudgetForm from './BudgetForm.jsx'
import StatCard from './StatCard.jsx'
import BottomSheet from '../BottomSheet.jsx'
import { CATEGORIES } from '../../constants/categories'
import { BUDGET_CATEGORIES, BUDGET_PERIODS } from '../../constants/budgetCategories'
import { mergeCategories } from '../../utils/mergeCategories'
import { formatCurrency, formatDate } from '../../utils/format'
import { useFeedback } from '../../context/useFeedback.js'
import { ListSkeleton } from '../feedback/Skeleton.jsx'
import EmptyState from '../feedback/EmptyState.jsx'
import { loadErrorMessage } from '../../api/config'
import { PlusIcon, WalletIcon, ArrowDownIcon, PercentIcon } from '../icons/Icons.jsx'

// The names the Transactions page filters by, so a budget's "view spending"
// link selects the matching category there.
const TRANSACTION_CATEGORIES = mergeCategories(CATEGORIES, BUDGET_CATEGORIES);

function todayAsDateString() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

// A budget covers fixed dates and does not renew itself, so one whose dates
// have passed, or have not started, is marked as such.
function timeState(budget, today) {
  if (budget.endDate.slice(0, 10) < today) return 'ended';
  if (budget.startDate.slice(0, 10) > today) return 'upcoming';
  return 'current';
}

function spendingLink(budget) {
  const category = TRANSACTION_CATEGORIES.find((c) => c.toLowerCase() === budget.category.toLowerCase()) || budget.category;
  const params = new URLSearchParams({
    type: 'expense',
    category,
    startDate: budget.startDate.slice(0, 10),
    endDate: budget.endDate.slice(0, 10),
  });
  return `/transactions?${params}`;
}

// The whole Budgets page: the title with its Add button, the totals, a
// filter by period, one card per budget, and the dialog for adding or
// editing one.
//
// Every figure comes from the API, which works out each budget's `spent` as
// its category's expenses dated within the budget's start and end, and
// `remaining` as the budgeted amount minus that (negative once over).
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
  // 'all', or one of the budget periods (weekly, monthly, yearly, custom).
  const [periodFilter, setPeriodFilter] = useState('all');

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

  const today = todayAsDateString();
  // Only the periods the user actually has budgets for are offered.
  const periodsInUse = BUDGET_PERIODS.map((p) => p.value).filter((value) => budgets.some((b) => b.period === value));
  const activeFilter = periodFilter !== 'all' && !periodsInUse.includes(periodFilter) ? 'all' : periodFilter;
  const shown = activeFilter === 'all' ? budgets : budgets.filter((b) => b.period === activeFilter);

  // Totals of the budgets shown: remaining is budgeted minus spent, the
  // same sum each card does.
  const totalBudgeted = shown.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = shown.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;

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

      {isLoading ? (
        <div className="section-card"><ListSkeleton label={t('budgets.loading')} /></div>
      ) : error ? (
        <div className="dashboard-error">
          <p>{error}</p>
          <button onClick={retry}>{t('common.retry')}</button>
        </div>
      ) : budgets.length === 0 ? (
        <div className="section-card">
          <EmptyState icon="bell" message={t('budgets.empty')}>
            <button type="button" className="btn btn-primary" onClick={() => setDialog({ kind: 'add' })}>
              <PlusIcon />
              {t('budgets.addBudget')}
            </button>
          </EmptyState>
        </div>
      ) : (
        <>
          {periodsInUse.length > 1 && (
            <div className="period-presets budget-period-filter" role="group" aria-label={t('budgets.period')}>
              {['all', ...periodsInUse].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={activeFilter === value ? 'active' : ''}
                  aria-pressed={activeFilter === value}
                  onClick={() => setPeriodFilter(value)}
                >
                  {value === 'all' ? t('budgets.allPeriods') : t(`frequencies.${value}`)}
                </button>
              ))}
            </div>
          )}

          <div className="stat-cards-row budget-overview">
            <StatCard
              title={t('budgets.totalBudgeted')}
              value={formatCurrency(totalBudgeted)}
              icon={<WalletIcon />}
              iconTone="info"
              hint={t('budgets.overviewHint')}
            />
            <StatCard
              title={t('budgets.totalSpent')}
              value={formatCurrency(totalSpent)}
              icon={<ArrowDownIcon />}
              iconTone="danger"
              hint={t('budgets.overviewHint')}
            />
            <StatCard
              title={totalRemaining < 0 ? t('budgets.totalOver') : t('budgets.totalRemaining')}
              value={formatCurrency(Math.abs(totalRemaining))}
              accent={totalRemaining < 0 ? 'negative' : 'positive'}
              icon={<PercentIcon />}
              iconTone={totalRemaining < 0 ? 'danger' : 'success'}
              hint={t('budgets.overviewHint')}
            />
          </div>

          {actionError && <p className="auth-error" role="alert">{actionError}</p>}

          <ul className="budget-grid">
            {shown.map((b) => {
              const isOver = b.remaining < 0;
              const state = timeState(b, today);
              return (
                <li key={b.id} className="card budget-card">
                  <div className="budget-card-header">
                    <div className="budget-card-title">
                      <h2>{b.name}</h2>
                      <p className="budget-card-meta">{b.category} · {t(`frequencies.${b.period}`)}</p>
                    </div>
                    <span className={`budget-status-label status-${b.status}`}>
                      {t(`budgets.status.${b.status}`)}
                    </span>
                  </div>

                  <dl className="budget-figures">
                    <div>
                      <dt>{t('budgets.budgeted')}</dt>
                      <dd>{formatCurrency(b.amount)}</dd>
                    </div>
                    <div>
                      <dt>{t('budgets.spent')}</dt>
                      <dd>{formatCurrency(b.spent)}</dd>
                    </div>
                    {/* Past the limit, say by how much rather than a negative or zero "remaining" */}
                    <div className={isOver ? 'budget-figure-over' : 'budget-figure-left'}>
                      <dt>{isOver ? t('budgets.overByLabel') : t('budgets.remainingLabel')}</dt>
                      <dd>{formatCurrency(Math.abs(b.remaining))}</dd>
                    </div>
                  </dl>

                  <div
                    className="progress-bar"
                    role="progressbar"
                    aria-label={t('budgets.percentUsed', { percent: b.percentUsed.toFixed(0) })}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.min(Math.round(b.percentUsed), 100)}
                  >
                    <div
                      className={`progress-bar-fill ${b.status}`}
                      style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                    />
                  </div>
                  <p className="budget-card-foot">
                    <span className="budget-card-percent">{t('budgets.percentUsed', { percent: b.percentUsed.toFixed(0) })}</span>
                    <span>
                      {formatDate(b.startDate)} – {formatDate(b.endDate)}
                      {state !== 'current' && <span className="budget-time-state">{t(`budgets.${state}`)}</span>}
                    </span>
                  </p>

                  <div className="row-actions">
                    <Link to={spendingLink(b)} className="btn btn-secondary btn-sm">{t('budgets.viewSpending')}</Link>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDialog({ kind: 'edit', budget: b })}>
                      {t('common.edit')}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm row-action-delete" onClick={() => handleDelete(b.id)}>
                      {t('common.delete')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

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
