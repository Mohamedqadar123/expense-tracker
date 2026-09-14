import { useTranslation } from 'react-i18next'
import StatCard from './StatCard.jsx'

function formatCurrency(n) {
  return `$${n.toFixed(2)}`;
}

function StatCardsRow({ summary }) {
  const { t } = useTranslation();
  const { totalBalance, income, expenses, savings, savingsRate } = summary;

  return (
    <div className="stat-cards-row">
      <StatCard title={t('dashboard.totalBalance')} value={formatCurrency(totalBalance)} accent={totalBalance >= 0 ? 'positive' : 'negative'} />
      <StatCard title={t('dashboard.totalIncome')} value={formatCurrency(income)} accent="positive" />
      <StatCard title={t('dashboard.totalExpenses')} value={formatCurrency(expenses)} accent="negative" />
      <StatCard title={t('dashboard.savings')} value={formatCurrency(savings)} accent={savings >= 0 ? 'positive' : 'negative'} />
      <StatCard
        title={t('dashboard.savingsRate')}
        value={savingsRate === null ? t('common.notAvailable') : `${savingsRate.toFixed(0)}%`}
        accent={savingsRate === null ? '' : savingsRate >= 0 ? 'positive' : 'negative'}
      />
    </div>
  );
}

export default StatCardsRow
