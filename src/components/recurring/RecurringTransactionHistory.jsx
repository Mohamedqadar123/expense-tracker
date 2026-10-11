import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getRecurringTransactionHistory } from '../../api/recurring'
import { formatSignedCurrency, formatDate } from '../../utils/format'

function RecurringTransactionHistory({ recurringTransactionId }) {
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getRecurringTransactionHistory(recurringTransactionId)
      .then(setHistory)
      .catch(() => setError(t('recurring.historyLoadError')))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recurringTransactionId]);

  if (isLoading) return <p className="list-empty">{t('recurring.loadingHistory')}</p>;
  if (error) return <p className="auth-error">{error}</p>;
  if (history.length === 0) return <p className="list-empty">{t('recurring.noOccurrences')}</p>;

  return (
    <ul className="recurring-history">
      {history.map(entry => (
        <li key={entry.id}>
          <span className="recurring-history-date">{formatDate(entry.occurrenceDate)}</span>
          {entry.transaction ? (
            <span className="recurring-history-amount">
              {formatSignedCurrency(entry.transaction.amount, entry.transaction.type)} — {entry.transaction.description}
            </span>
          ) : (
            <span className="recurring-history-amount">{t('recurring.transactionDeleted')}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default RecurringTransactionHistory
