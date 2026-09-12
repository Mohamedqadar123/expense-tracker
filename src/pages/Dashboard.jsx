import { useState, useEffect, useCallback } from 'react'
import './Dashboard.css'
import { getDashboardOverview } from '../api/dashboard'
import { getPeriodRange } from '../utils/periodRange'
import PeriodSelector from '../components/dashboard/PeriodSelector.jsx'
import StatCardsRow from '../components/dashboard/StatCardsRow.jsx'
import MonthlySpendingTrendChart from '../components/dashboard/MonthlySpendingTrendChart.jsx'
import IncomeExpensesChart from '../components/dashboard/IncomeExpensesChart.jsx'
import SpendingByCategoryChart from '../components/dashboard/SpendingByCategoryChart.jsx'
import RecentTransactionsList from '../components/dashboard/RecentTransactionsList.jsx'
import InsightsList from '../components/dashboard/InsightsList.jsx'
import BudgetAlertsBanner from '../components/dashboard/BudgetAlertsBanner.jsx'
import BudgetsSection from '../components/dashboard/BudgetsSection.jsx'
import SavingsGoalsSection from '../components/dashboard/SavingsGoalsSection.jsx'

function todayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function Dashboard() {
  const [preset, setPreset] = useState('month');
  const [customStart, setCustomStart] = useState(todayString());
  const [customEnd, setCustomEnd] = useState(todayString());

  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  const { start, end } = getPeriodRange(preset, customStart, customEnd);

  useEffect(() => {
    getDashboardOverview({ start, end })
      .then(setOverview)
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setIsLoading(false));
  }, [start, end, retryKey]);

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

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p className="subtitle">Your financial overview</p>

      <PeriodSelector
        preset={preset}
        customStart={customStart}
        customEnd={customEnd}
        onChange={handlePeriodChange}
      />

      {isLoading ? (
        <p className="dashboard-status">Loading dashboard...</p>
      ) : error ? (
        <div className="dashboard-error">
          <p>{error}</p>
          <button onClick={handleRetry}>Retry</button>
        </div>
      ) : (
        <>
          <BudgetAlertsBanner budgets={overview.budgetProgress} />

          <StatCardsRow summary={overview.summary} />

          <div className="dashboard-charts-grid">
            <MonthlySpendingTrendChart data={overview.monthlySpendingTrend} />
            <IncomeExpensesChart data={overview.incomeVsExpenses} />
            <SpendingByCategoryChart data={overview.spendingByCategory} />
          </div>

          <div className="dashboard-lists-grid">
            <RecentTransactionsList transactions={overview.recentTransactions} />
            <InsightsList insights={overview.insights} />
          </div>
        </>
      )}

      <BudgetsSection />
      <SavingsGoalsSection />
    </div>
  );
}

export default Dashboard
