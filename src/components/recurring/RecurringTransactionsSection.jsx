import { useState, useEffect } from 'react'
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
import { formatSignedCurrency, formatDate } from '../../utils/format'
import { useFeedback } from '../../context/useFeedback.js'
import { ListSkeleton } from '../feedback/Skeleton.jsx'
import EmptyState from '../feedback/EmptyState.jsx'

function RecurringTransactionsSection() {
  const { t } = useTranslation();
  const { confirm, notify } = useFeedback();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [historyId, setHistoryId] = useState(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    getRecurringTransactions()
      .then(setItems)
      .catch(() => setError(t('recurring.loadError')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (data) => {
    await createRecurringTransaction(data);
    load();
    notify(t('feedback.added'));
  };

  const handleUpdate = async (id, data) => {
    await updateRecurringTransaction(id, data);
    setEditingId(null);
    load();
    notify(t('feedback.saved'));
  };

  const handleDelete = async (id) => {
    if (!(await confirm(t('recurring.deleteConfirm'), t('common.delete')))) return;
    try {
      await deleteRecurringTransaction(id);
      load();
      notify(t('feedback.deleted'));
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePause = async (id) => {
    try {
      await pauseRecurringTransaction(id);
      load();
      notify(t('feedback.saved'));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResume = async (id) => {
    try {
      await resumeRecurringTransaction(id);
      load();
      notify(t('feedback.saved'));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="section-card">
      <h2>{t('recurring.title')}</h2>
      {isLoading ? (
        <ListSkeleton label={t('recurring.loading')} />
      ) : error ? (
        <div className="dashboard-error">
          <p>{error}</p>
          <button onClick={load}>{t('common.retry')}</button>
        </div>
      ) : (
        <>
          {items.length === 0 ? (
            <EmptyState icon="repeat" message={t('recurring.empty')} />
          ) : (
            <ul className="recurring-list">
              {items.map(r => (
                <li key={r.id}>
                  {editingId === r.id ? (
                    <RecurringTransactionForm
                      initialValues={r}
                      onSubmit={(data) => handleUpdate(r.id, data)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
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
                      <div className="recurring-actions">
                        <button onClick={() => setEditingId(r.id)}>{t('common.edit')}</button>
                        {r.status === 'active' ? (
                          <button onClick={() => handlePause(r.id)}>{t('recurring.pause')}</button>
                        ) : (
                          <button onClick={() => handleResume(r.id)}>{t('recurring.resume')}</button>
                        )}
                        <button onClick={() => setHistoryId(historyId === r.id ? null : r.id)}>
                          {historyId === r.id ? t('recurring.hideHistory') : t('recurring.history')}
                        </button>
                        <button onClick={() => handleDelete(r.id)}>{t('common.delete')}</button>
                      </div>
                      {historyId === r.id && (
                        <div className="recurring-history-panel">
                          <RecurringTransactionHistory recurringTransactionId={r.id} />
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          <h3 className="section-subheading">{t('recurring.addRecurring')}</h3>
          <RecurringTransactionForm onSubmit={handleCreate} />
        </>
      )}
    </div>
  );
}

export default RecurringTransactionsSection
