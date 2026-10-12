import { useTranslation } from 'react-i18next'
import { formatSignedCurrency, formatDate } from '../../utils/format'

function TransactionsTable({ transactions }) {
  const { t } = useTranslation();

  return (
    <div className="section-card">
      <h2>{t('reports.transactionsHeading')}</h2>
      {transactions.length === 0 ? (
        <p className="list-empty">{t('dashboard.noTransactionsPeriod')}</p>
      ) : (
        <div className="reports-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t('transactions.date')}</th>
                <th>{t('transactions.description')}</th>
                <th>{t('transactions.category')}</th>
                <th>{t('reports.type')}</th>
                <th>{t('transactions.amount')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td data-label={t('transactions.date')}>{formatDate(tx.date)}</td>
                  <td data-label={t('transactions.description')}>{tx.description}</td>
                  <td data-label={t('transactions.category')}>{tx.category}</td>
                  <td data-label={t('reports.type')}>{t(`common.${tx.type}`)}</td>
                  <td data-label={t('transactions.amount')} className={tx.type === 'income' ? 'income-amount' : 'expense-amount'}>
                    {formatSignedCurrency(tx.amount, tx.type)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TransactionsTable
