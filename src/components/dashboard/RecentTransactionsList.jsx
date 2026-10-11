import { useTranslation } from 'react-i18next'
import { formatSignedCurrency, formatDate } from '../../utils/format'

function RecentTransactionsList({ transactions }) {
  const { t } = useTranslation();

  return (
    <div className="list-card">
      <h3>{t('dashboard.recentTransactions')}</h3>
      {transactions.length === 0 ? (
        <p className="list-empty">{t('dashboard.noTransactionsPeriod')}</p>
      ) : (
        <ul className="recent-transactions">
          {transactions.map(tx => (
            <li key={tx.id}>
              <div>
                <span className="rt-description">{tx.description}</span>
                <span className="rt-date">{formatDate(tx.date)}</span>
              </div>
              <span className={tx.type === 'income' ? 'income-amount' : 'expense-amount'}>
                {formatSignedCurrency(tx.amount, tx.type)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RecentTransactionsList
