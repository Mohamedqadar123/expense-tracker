import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  pauseRecurringTransaction,
  resumeRecurringTransaction,
} from '../../api/recurring'
import RecurringTransactionForm from './RecurringTransactionForm.jsx'
import RecurringTransactionHistory from './RecurringTransactionHistory.jsx'
import BottomSheet from '../BottomSheet.jsx'
import { formatSignedCurrency, formatDate } from '../../utils/format'
import { useFeedback } from '../../context/useFeedback.js'
import { ListSkeleton } from '../feedback/Skeleton.jsx'
import EmptyState from '../feedback/EmptyState.jsx'
import { loadErrorMessage } from '../../api/config'
import { PlusIcon } from '../icons/Icons.jsx'

// The whole Recurring Transactions page: the title with its Add button, the
// list with each item's schedule and history, and the dialog for adding or
// editing one.
function RecurringTransactionsSection() {
  const { t } = useTranslation();
  const { confirm, notify } = useFeedback();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Why an action was refused. Shown above the list, which stays where it is.
  const [actionError, setActionError] = useState(null);
  // The open dialog: { kind: 'add' } or { kind: 'edit', item }.
  const [dialog, setDialog] = useState(null);
  const [historyId, setHistoryId] = useState(null);

  const load = useCallback(() => {
    return getRecurringTransactions()
      .then((list) => {
        setItems(list);
        setError(null);
      })
      .catch((err) => setError(loadErrorMessage(err, t('recurring.loadError'))))
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
    await createRecurringTransaction(data);
    closeDialog();
    load();
    notify(t('feedback.added'));
  };

  const handleUpdate = async (id, data) => {
    await updateRecurringTransaction(id, data);
    closeDialog();
    load();
    notify(t('feedback.saved'));
  };

  // Delete, pause and resume: run it, reload, say it worked; or say why not.
  const runAction = async (action, successMessage) => {
    setActionError(null);
    try {
      await action();
      load();
      notify(successMessage);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm(t('recurring.deleteConfirm'), t('common.delete')))) return;
    runAction(() => deleteRecurringTransaction(id), t('feedback.deleted'));
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('recurring.title')}</h1>
          <p className="subtitle">{t('recurring.subtitle')}</p>
        </div>
        <button type="button" className="btn btn-primary page-header-add" onClick={() => setDialog({ kind: 'add' })}>
          <PlusIcon />
          {t('recurring.addRecurring')}
        </button>
      </div>

      <div className="section-card">
        {isLoading ? (
          <ListSkeleton label={t('recurring.loading')} />
        ) : error ? (
          <div className="dashboard-error">
            <p>{error}</p>
            <button onClick={retry}>{t('common.retry')}</button>
          </div>
        ) : (
          <>
            {actionError && <p className="auth-error" role="alert">{actionError}</p>}
            {items.length === 0 ? (
              <EmptyState icon="repeat" message={t('recurring.empty')} />
            ) : (
              <ul className="recurring-list">
                {items.map(r => (
                  <li key={r.id}>
                    <div className="recurring-row-header">
                      <div>
                        <span className="recurring-name">{r.description}</span>
                        <span className="recurring-meta"> · {r.category} · {t(`frequencies.${r.frequency}`)}{r.account ? ` · ${r.account}` : ''}</span>
                      </div>
                      <span className={`recurring-status-badge status-${r.status}`}>
                        {r.status === 'active' ? t('recurring.active') : t('recurring.paused')}
                      </span>
                    </div>
                    <div className="recurring-amounts">
                      <span className={r.type === 'income' ? 'income-amount' : 'expense-amount'}>
                        {formatSignedCurrency(r.amount, r.type)}
                      </span>
                      <span>{t('recurring.next', { date: formatDate(r.nextExecutionDate) })}</span>
                    </div>
                    <p className="recurring-dates">
                      {formatDate(r.startDate)} – {r.endDate ? formatDate(r.endDate) : t('recurring.noEndDate')}
                    </p>
                    <div className="row-actions">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDialog({ kind: 'edit', item: r })}>
                        {t('common.edit')}
                      </button>
                      {r.status === 'active' ? (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => runAction(() => pauseRecurringTransaction(r.id), t('feedback.saved'))}>
                          {t('recurring.pause')}
                        </button>
                      ) : (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => runAction(() => resumeRecurringTransaction(r.id), t('feedback.saved'))}>
                          {t('recurring.resume')}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        aria-expanded={historyId === r.id}
                        onClick={() => setHistoryId(historyId === r.id ? null : r.id)}
                      >
                        {historyId === r.id ? t('recurring.hideHistory') : t('recurring.history')}
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm row-action-delete" onClick={() => handleDelete(r.id)}>
                        {t('common.delete')}
                      </button>
                    </div>
                    {historyId === r.id && (
                      <div className="recurring-history-panel">
                        <RecurringTransactionHistory recurringTransactionId={r.id} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <BottomSheet isOpen={dialog?.kind === 'add'} onClose={closeDialog} title={t('recurring.addRecurring')}>
        <RecurringTransactionForm onSubmit={handleCreate} onCancel={closeDialog} />
      </BottomSheet>

      <BottomSheet isOpen={dialog?.kind === 'edit'} onClose={closeDialog} title={t('recurring.editRecurring')}>
        {dialog?.kind === 'edit' && (
          <RecurringTransactionForm
            key={dialog.item.id}
            initialValues={dialog.item}
            onSubmit={(data) => handleUpdate(dialog.item.id, data)}
            onCancel={closeDialog}
          />
        )}
      </BottomSheet>
    </>
  );
}

export default RecurringTransactionsSection
