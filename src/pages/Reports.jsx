import { useState, useEffect, useCallback } from 'react'
import './Dashboard.css'
import './Reports.css'
import { getReportsOverview } from '../api/reports'
import { getReportPeriodRange } from '../utils/reportPeriodRange'
import { REPORT_PRESETS } from '../constants/periodPresets'
import PeriodSelector from '../components/dashboard/PeriodSelector.jsx'
import ReportSummaryCards from '../components/reports/ReportSummaryCards.jsx'
import CategoryBreakdownCharts from '../components/reports/CategoryBreakdownCharts.jsx'
import CashFlowCharts from '../components/reports/CashFlowCharts.jsx'
import BudgetPerformanceTable from '../components/reports/BudgetPerformanceTable.jsx'
import TransactionsTable from '../components/reports/TransactionsTable.jsx'
import ReportExportToolbar from '../components/reports/ReportExportToolbar.jsx'

function todayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function Reports() {
  const [preset, setPreset] = useState('month');
  const [customStart, setCustomStart] = useState(todayString());
  const [customEnd, setCustomEnd] = useState(todayString());

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  const { start, end } = getReportPeriodRange(preset, customStart, customEnd);

  useEffect(() => {
    getReportsOverview({ start, end })
      .then(setReport)
      .catch(() => setError('Failed to load report data'))
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
    <div className="reports">
      <h1>Financial Reports</h1>
      <p className="subtitle">Complete overview of your finances</p>

      <div className="reports-toolbar no-print">
        <PeriodSelector
          preset={preset}
          customStart={customStart}
          customEnd={customEnd}
          onChange={handlePeriodChange}
          presets={REPORT_PRESETS}
        />
        <ReportExportToolbar report={report} start={start} end={end} disabled={isLoading || !!error} />
      </div>

      {isLoading ? (
        <p className="dashboard-status">Loading report...</p>
      ) : error ? (
        <div className="dashboard-error">
          <p>{error}</p>
          <button onClick={handleRetry}>Retry</button>
        </div>
      ) : (
        <div className="reports-content">
          <ReportSummaryCards summary={report.summary} />
          <CategoryBreakdownCharts
            expenseByCategory={report.expenseByCategory}
            incomeByCategory={report.incomeByCategory}
          />
          <CashFlowCharts dailyCashFlow={report.dailyCashFlow} monthlyCashFlow={report.monthlyCashFlow} />
          <BudgetPerformanceTable budgets={report.budgetProgress} />
          <TransactionsTable transactions={report.transactions} />
        </div>
      )}
    </div>
  );
}

export default Reports
