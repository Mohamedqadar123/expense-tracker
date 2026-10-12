import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatSignedCurrency, formatDate } from '../../utils/format'

// The latest transactions of the selected period. `start` and `end` are that
// period, so "view all" opens the full list filtered to the same dates.
function RecentTransactionsList({ transactions, start, end }) {
  const { t } = useTranslation();
  const viewAllTo = start && end ? `/transactions?startDate=${start}&endDate=${end}` : '/transactions';

  return (
    <div className="list-card recent-card">
      <div className="recent-card-header">
        <h3>{t('dashboard.recentTransactions')}</h3>
        <Link to={viewAllTo} className="recent-view-all">{t('dashboard.viewAll')}</Link>
      </div>
      {transactions.length === 0 ? (
        <p className="list-empty">{t('dashboard.noTransactionsPeriod')}</p>
      ) : (
        <table className="recent-table">
          <thead>
            <tr>
              <th>{t('transactions.date')}</th>
              <th>{t('transactions.description')}</th>
              <th>{t('transactions.category')}</th>
              <th>{t('transactions.account')}</th>
              <th>{t('reports.type')}</th>
              <th className="recent-amount">{t('transactions.amount')}</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id}>
                <td data-label={t('transactions.date')}>{formatDate(tx.date)}</td>
                <td data-label={t('transactions.description')} className="recent-description">{tx.description}</td>
                <td data-label={t('transactions.category')} className="recent-category">{tx.category}</td>
                <td data-label={t('transactions.account')}>{tx.account || '—'}</td>
                <td data-label={t('reports.type')}>
                  <span className={`type-badge type-badge-${tx.type}`}>
                    {tx.type === 'income' ? t('common.income') : t('common.expense')}
                  </span>
                </td>
                <td
                  data-label={t('transactions.amount')}
                  className={`recent-amount ${tx.type === 'income' ? 'income-amount' : 'expense-amount'}`}
                >
                  {formatSignedCurrency(tx.amount, tx.type)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default RecentTransactionsList
