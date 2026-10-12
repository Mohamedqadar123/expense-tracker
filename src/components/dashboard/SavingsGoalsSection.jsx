import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getGoals, createGoal, updateGoal, deleteGoal } from '../../api/goals'
import SavingsGoalForm from './SavingsGoalForm.jsx'
import GoalDepositForm from './GoalDepositForm.jsx'
import GoalRemoveForm from './GoalRemoveForm.jsx'
import BottomSheet from '../BottomSheet.jsx'
import { formatCurrency, formatDate } from '../../utils/format'
import { useFeedback } from '../../context/useFeedback.js'
import { ListSkeleton } from '../feedback/Skeleton.jsx'
import EmptyState from '../feedback/EmptyState.jsx'
import { loadErrorMessage } from '../../api/config'
import { PlusIcon } from '../icons/Icons.jsx'

// The whole Goals page: the title with its Add button, each goal with its
// progress, and the dialogs for adding or editing a goal and for putting
// more money into one.
function SavingsGoalsSection() {
  const { t } = useTranslation();
  const { confirm, notify } = useFeedback();
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Why an action was refused. Shown above the list, which stays where it is.
  const [actionError, setActionError] = useState(null);
  // The open dialog: { kind: 'add' }, { kind: 'edit', goal }, { kind: 'deposit', goal }
  // or { kind: 'remove', goal }.
  const [dialog, setDialog] = useState(null);

  const load = useCallback(() => {
    return getGoals()
      .then((list) => {
        setGoals(list);
        setError(null);
      })
      .catch((err) => setError(loadErrorMessage(err, t('goals.loadError'))))
      .finally(() => setIsLoading(false));
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const retry = () => {
    setIsLoading(true);
    load();
  };

  const closeDialog = () => setDialog(null);

  const handleCreate = async (data) => {
    await createGoal(data);
    closeDialog();
    load();
    notify(t('feedback.added'));
  };

  const handleUpdate = async (id, data) => {
    await updateGoal(id, data);
    closeDialog();
    load();
    notify(t('feedback.saved'));
  };

  // The API takes a goal's new saved total and moves the difference out of
  // the chosen account, so a deposit is the old total plus the amount. The
  // target date is left out, which leaves it as it is.
  const handleDeposit = async (goal, { amount, account }) => {
    await updateGoal(goal.id, {
      name: goal.name,
      targetAmount: goal.targetAmount,
      savedAmount: goal.savedAmount + amount,
      account,
    });
    closeDialog();
    load();
    notify(t('feedback.saved'));
  };

  // A goal with nothing in it is simply deleted. One that holds money was
  // paid for out of an account, so it opens a dialog asking where the money
  // goes back to (see handleRemove).
  const handleDelete = async (goal) => {
    if (goal.savedAmount > 0) {
      setDialog({ kind: 'remove', goal });
      return;
    }
    if (!(await confirm(t('goals.deleteConfirm'), t('common.delete')))) return;
    setActionError(null);
    try {
      await deleteGoal(goal.id);
      load();
      notify(t('feedback.deleted'));
    } catch (err) {
      setActionError(err.message);
    }
  };

  // The API's delete removes the goal but leaves its money debited, so the
  // saved amount is first lowered to zero, which credits it back to the
  // chosen account, and only then is the goal deleted. If the second step
  // fails the goal is left empty, with the money already safely returned.
  const handleRemove = async (goal, account) => {
    try {
      await updateGoal(goal.id, { name: goal.name, targetAmount: goal.targetAmount, savedAmount: 0, account });
      await deleteGoal(goal.id);
    } finally {
      load();
    }
    closeDialog();
    notify(t('feedback.deleted'));
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('goals.title')}</h1>
          <p className="subtitle">{t('goals.subtitle')}</p>
        </div>
        <button type="button" className="btn btn-primary page-header-add" onClick={() => setDialog({ kind: 'add' })}>
          <PlusIcon />
          {t('goals.addGoal')}
        </button>
      </div>

      <div className="section-card">
        <h2>{t('goals.heading')}</h2>
        {isLoading ? (
          <ListSkeleton label={t('goals.loading')} />
        ) : error ? (
          <div className="dashboard-error">
            <p>{error}</p>
            <button onClick={retry}>{t('common.retry')}</button>
          </div>
        ) : (
          <>
            {actionError && <p className="auth-error" role="alert">{actionError}</p>}
            {goals.length === 0 ? (
              <EmptyState icon="target" message={t('goals.empty')} />
            ) : (
              <ul className="goal-list">
                {goals.map(g => {
                  const percent = g.targetAmount > 0 ? Math.min((g.savedAmount / g.targetAmount) * 100, 100) : 0;
                  const toGo = g.targetAmount - g.savedAmount;
                  return (
                    <li key={g.id}>
                      <div className="budget-row-header">
                        <span className="budget-category">{g.name}</span>
                        <span>{formatCurrency(g.savedAmount)} / {formatCurrency(g.targetAmount)}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
                      </div>
                      <div className="budget-amounts">
                        <span>{Math.floor(percent)}%</span>
                        {toGo > 0 ? (
                          <span>{t('goals.toGo', { amount: formatCurrency(toGo) })}</span>
                        ) : (
                          <span className="goal-reached">{t('goals.reached')}</span>
                        )}
                        {g.targetDate && <span>{t('goals.target', { date: formatDate(g.targetDate) })}</span>}
                      </div>
                      <div className="row-actions">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDialog({ kind: 'deposit', goal: g })}>
                          {t('goals.addMoney')}
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDialog({ kind: 'edit', goal: g })}>
                          {t('common.edit')}
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm row-action-delete" onClick={() => handleDelete(g)}>
                          {t('common.delete')}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>

      <BottomSheet isOpen={dialog?.kind === 'add'} onClose={closeDialog} title={t('goals.addGoal')}>
        <SavingsGoalForm onSubmit={handleCreate} onCancel={closeDialog} />
      </BottomSheet>

      <BottomSheet isOpen={dialog?.kind === 'edit'} onClose={closeDialog} title={t('goals.editGoal')}>
        {dialog?.kind === 'edit' && (
          <SavingsGoalForm
            key={dialog.goal.id}
            initialValues={dialog.goal}
            onSubmit={(data) => handleUpdate(dialog.goal.id, data)}
            onCancel={closeDialog}
          />
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={dialog?.kind === 'deposit'}
        onClose={closeDialog}
        title={dialog?.kind === 'deposit' ? t('goals.addMoneyTo', { name: dialog.goal.name }) : ''}
      >
        {dialog?.kind === 'deposit' && (
          <GoalDepositForm
            key={dialog.goal.id}
            onSubmit={(deposit) => handleDeposit(dialog.goal, deposit)}
            onCancel={closeDialog}
          />
        )}
      </BottomSheet>

      <BottomSheet isOpen={dialog?.kind === 'remove'} onClose={closeDialog} title={t('goals.deleteGoal')}>
        {dialog?.kind === 'remove' && (
          <GoalRemoveForm
            key={dialog.goal.id}
            goal={dialog.goal}
            onSubmit={(account) => handleRemove(dialog.goal, account)}
            onCancel={closeDialog}
          />
        )}
      </BottomSheet>
    </>
  );
}

export default SavingsGoalsSection
