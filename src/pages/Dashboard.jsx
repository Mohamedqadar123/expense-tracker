import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import '../styles/shared.css'
import './Dashboard.css'
import { getDashboardOverview } from '../api/dashboard'
import { getAccounts } from '../api/accounts'
import { useAuth } from '../context/useAuth.js'
import { getPeriodRange, getPreviousPeriodRange } from '../utils/periodRange'
import { getUsername } from '../utils/username'
import PeriodSelector from '../components/dashboard/PeriodSelector.jsx'
import StatCardsRow from '../components/dashboard/StatCardsRow.jsx'
import IncomeExpensesChart from '../components/dashboard/IncomeExpensesChart.jsx'
import SpendingByCategoryChart from '../components/dashboard/SpendingByCategoryChart.jsx'
import RecentTransactionsList from '../components/dashboard/RecentTransactionsList.jsx'
import InsightsList from '../components/dashboard/InsightsList.jsx'
import BudgetAlertsBanner from '../components/dashboard/BudgetAlertsBanner.jsx'
import { OverviewSkeleton } from '../components/feedback/Skeleton.jsx'
import EmptyState from '../components/feedback/EmptyState.jsx'
import { PlusIcon } from '../components/icons/Icons.jsx'
import { loadErrorMessage } from '../api/config'

function todayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// The add-transaction form belongs to the app shell (Layout), which opens it
// when it hears this.
function openQuickAdd() {
  window.dispatchEvent(new CustomEvent('quick-add:open'));
}

function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [preset, setPreset] = useState('month');
  const [customStart, setCustomStart] = useState(todayString());
  const [customEnd, setCustomEnd] = useState(todayString());

  const [overview, setOverview] = useState(null);
  // Summary of the period just before the selected one, for the comparisons
  // on the cards; and the accounts, whose balances add up to the total
  // balance. Both are extras: the dashboard still shows without them.
  const [previousSummary, setPreviousSummary] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  const { start, end } = getPeriodRange(preset, customStart, customEnd);

  useEffect(() => {
    // A slow answer for a period the user has already moved on from must not
    // replace the figures of the one now selected.
    let isCurrent = true;
    Promise.all([
      getDashboardOverview({ start, end }),
      getDashboardOverview(getPreviousPeriodRange(start, end)).catch(() => null),
      getAccounts().catch(() => null),
    ])
      .then(([current, previous, accountList]) => {
        if (!isCurrent) return;
        // A reload that works (e.g. after a transaction is added) clears an
        // earlier failure, which would otherwise stay on screen
        setError(null);
        setOverview(current);
        setPreviousSummary(previous?.summary ?? null);
        setAccounts(Array.isArray(accountList) ? accountList : null);
      })
      .catch((err) => { if (isCurrent) setError(loadErrorMessage(err, t('dashboard.loadError'))); })
      .finally(() => { if (isCurrent) setIsLoading(false); });
    return () => { isCurrent = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, start, end, retryKey]);

  // A transaction added from the header or the add button changes every
  // number here, so the overview is fetched again.
  useEffect(() => {
    const handleCreated = () => setRetryKey((k) => k + 1);
    window.addEventListener('transaction:created', handleCreated);
    return () => window.removeEventListener('transaction:created', handleCreated);
  }, []);

  const handlePeriodChange = useCallback(({ preset: nextPreset, customStart: nextStart, customEnd: nextEnd }) => {
    setPreset(nextPreset);
    if (nextStart !== undefined) setCustomStart(nextStart);
    if (nextEnd !== undefined) setCustomEnd(nextEnd);
    setIsLoading(true);
    setError(null);
  }, []);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setRetryKey(k => k + 1);
  };

  const name = user?.name?.trim().split(/\s+/)[0] || getUsername(user?.email);
  // Every transaction belongs to an account, so the accounts' balances add
  // up to everything the user holds. Without any account to add up, the
  // overview's own all-time figure stands in.
  const totalBalance = accounts?.length
    ? accounts.reduce((sum, account) => sum + account.balance, 0)
    : undefined;
  const hasActivity = overview && (overview.summary.income > 0 || overview.summary.expenses > 0);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>{name ? t('dashboard.welcome', { name }) : t('dashboard.title')}</h1>
          <p className="subtitle">{t('dashboard.subtitle')}</p>
        </div>
        <button type="button" className="btn btn-primary dashboard-add-button" onClick={openQuickAdd}>
          <PlusIcon />
          {t('nav.addTransaction')}
        </button>
      </div>

      <PeriodSelector
        preset={preset}
        customStart={customStart}
        customEnd={customEnd}
        onChange={handlePeriodChange}
      />

      {isLoading ? (
        <OverviewSkeleton label={t('dashboard.loading')} cards={4} charts={2} />
      ) : error ? (
        <div className="dashboard-error">
          <p>{error}</p>
          <button onClick={handleRetry}>{t('common.retry')}</button>
        </div>
      ) : (
        <>
          <BudgetAlertsBanner budgets={overview.budgetProgress} />

          <StatCardsRow
            summary={overview.summary}
            previousSummary={previousSummary}
            totalBalance={totalBalance}
          />

          {hasActivity ? (
            <>
              <div className="dashboard-charts-grid dashboard-charts-grid--two">
                <IncomeExpensesChart data={overview.incomeVsExpenses} />
                <SpendingByCategoryChart data={overview.spendingByCategory} />
              </div>

              <RecentTransactionsList transactions={overview.recentTransactions} start={start} end={end} />

              <InsightsList insights={overview.insights} />
            </>
          ) : (
            <div className="section-card">
              <EmptyState icon="chart" title={t('dashboard.emptyTitle')} message={t('dashboard.emptyBody')}>
                <button type="button" className="btn btn-primary" onClick={openQuickAdd}>
                  <PlusIcon />
                  {t('nav.addTransaction')}
                </button>
              </EmptyState>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard
