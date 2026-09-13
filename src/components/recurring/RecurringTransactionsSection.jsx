import { useState, useEffect } from 'react'
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

function RecurringTransactionsSection() {
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
      .catch(() => setError('Failed to load recurring transactions'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (data) => {
    await createRecurringTransaction(data);
    load();
  };

  const handleUpdate = async (id, data) => {
    await updateRecurringTransaction(id, data);
    setEditingId(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recurring transaction? Already-generated transactions will not be affected.')) return;
    await deleteRecurringTransaction(id);
    load();
  };

  const handlePause = async (id) => {
    await pauseRecurringTransaction(id);
    load();
  };

  const handleResume = async (id) => {
    await resumeRecurringTransaction(id);
    load();
  };

  return (
    <div className="section-card">
      <h2>Recurring Transactions</h2>
      {isLoading ? (
        <p className="list-empty">Loading recurring transactions...</p>
      ) : error ? (
        <div className="dashboard-error">
          <p>{error}</p>
          <button onClick={load}>Retry</button>
        </div>
      ) : (
        <>
          {items.length === 0 ? (
            <p className="list-empty">No recurring transactions yet — add one below.</p>
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
                          <span className="recurring-meta"> · {r.category} · {r.frequency}{r.account ? ` · ${r.account}` : ''}</span>
                        </div>
                        <span className={`recurring-status-badge status-${r.status}`}>
                          {r.status === 'active' ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <div className="recurring-amounts">
                        <span className={r.type === 'income' ? 'income-amount' : 'expense-amount'}>
                          {r.type === 'income' ? '+' : '-'}${r.amount.toFixed(2)}
                        </span>
                        <span>Next: {r.nextExecutionDate.slice(0, 10)}</span>
                      </div>
                      <p className="recurring-dates">
                        {r.startDate.slice(0, 10)} – {r.endDate ? r.endDate.slice(0, 10) : 'no end date'}
                      </p>
                      <div className="recurring-actions">
                        <button onClick={() => setEditingId(r.id)}>Edit</button>
                        {r.status === 'active' ? (
                          <button onClick={() => handlePause(r.id)}>Pause</button>
                        ) : (
                          <button onClick={() => handleResume(r.id)}>Resume</button>
                        )}
                        <button onClick={() => setHistoryId(historyId === r.id ? null : r.id)}>
                          {historyId === r.id ? 'Hide History' : 'History'}
                        </button>
                        <button onClick={() => handleDelete(r.id)}>Delete</button>
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
          <h3 className="section-subheading">Add Recurring Transaction</h3>
          <RecurringTransactionForm onSubmit={handleCreate} />
        </>
      )}
    </div>
  );
}

export default RecurringTransactionsSection
