import { useTranslation } from 'react-i18next'
import StatCard from './StatCard.jsx'
import { formatCurrency } from '../../utils/format'
import { WalletIcon, ArrowUpIcon, ArrowDownIcon, PercentIcon } from '../icons/Icons.jsx'

function signed(number) {
  // `|| 0` turns the -0 that rounding -0.4 gives into a plain 0
  const rounded = Math.round(number) || 0;
  return `${rounded > 0 ? '+' : ''}${rounded}`;
}

// Change from the earlier period as a percentage, or null when there is
// nothing to compare against: a percentage of zero means nothing.
function percentChange(current, previous) {
  if (!previous || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

// The dashboard's four headline figures. What each one means:
// - Total balance: what the accounts hold right now (starting balances plus
//   everything in, minus everything out). It is not tied to the period, and
//   it is `totalBalance` when given, otherwise the summary's own figure.
// - Total income / expenses: money in / out during the selected period.
// - Savings rate: the share of the period's income left after its expenses.
//   Without income there is nothing to take a share of, so it shows N/A.
// `previousSummary` is the same summary for the period just before; each
// comparison appears only when that period has a figure to compare with.
function StatCardsRow({ summary, previousSummary, totalBalance }) {
  const { t } = useTranslation();
  const { income, expenses, savingsRate } = summary;
  const balance = totalBalance ?? summary.totalBalance;

  const trendFor = (change, moreIsGood, key = 'dashboard.vsPrevious', suffix = '%') => {
    if (change === null) return undefined;
    const rounded = Math.round(change);
    const tone = rounded === 0 ? 'neutral' : (rounded > 0) === moreIsGood ? 'positive' : 'negative';
    return { label: t(key, { change: `${signed(change)}${suffix}` }), tone };
  };

  const incomeTrend = previousSummary && trendFor(percentChange(income, previousSummary.income), true);
  const expensesTrend = previousSummary && trendFor(percentChange(expenses, previousSummary.expenses), false);
  const rateTrend = previousSummary && savingsRate !== null && previousSummary.savingsRate !== null
    ? trendFor(savingsRate - previousSummary.savingsRate, true, 'dashboard.vsPreviousPoints', '')
    : undefined;

  return (
    <div className="stat-cards-row">
      <StatCard
        title={t('dashboard.totalBalance')}
        value={formatCurrency(balance)}
        accent={balance >= 0 ? 'positive' : 'negative'}
        icon={<WalletIcon />}
        iconTone="info"
        hint={t('dashboard.balanceHint')}
      />
      <StatCard
        title={t('dashboard.totalIncome')}
        value={formatCurrency(income)}
        accent="positive"
        icon={<ArrowUpIcon />}
        iconTone="success"
        hint={t('dashboard.incomeHint')}
        trend={incomeTrend}
      />
      <StatCard
        title={t('dashboard.totalExpenses')}
        value={formatCurrency(expenses)}
        accent="negative"
        icon={<ArrowDownIcon />}
        iconTone="danger"
        hint={t('dashboard.expensesHint')}
        trend={expensesTrend}
      />
      <StatCard
        title={t('dashboard.savingsRate')}
        value={savingsRate === null ? t('common.notAvailable') : `${savingsRate.toFixed(0)}%`}
        accent={savingsRate === null ? '' : savingsRate >= 0 ? 'positive' : 'negative'}
        icon={<PercentIcon />}
        iconTone="neutral"
        hint={savingsRate === null ? t('dashboard.savingsRateNoIncome') : t('dashboard.savingsRateHint')}
        trend={rateTrend}
      />
    </div>
  );
}

export default StatCardsRow
