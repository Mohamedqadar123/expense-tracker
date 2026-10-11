import { useTranslation } from 'react-i18next'
import SpendingByCategoryChart from '../dashboard/SpendingByCategoryChart.jsx'

// Where the period's money went and where it came from, as the same ring
// and list the dashboard uses for spending.
function CategoryBreakdownCharts({ expenseByCategory, incomeByCategory }) {
  const { t } = useTranslation();

  return (
    <div className="dashboard-charts-grid reports-charts-grid">
      <SpendingByCategoryChart
        title={t('reports.expenseByCategory')}
        data={expenseByCategory}
      />
      <SpendingByCategoryChart
        title={t('reports.incomeByCategory')}
        data={incomeByCategory}
        totalLabel={t('dashboard.totalIncome')}
        emptyMessage={t('reports.noIncomePeriod')}
      />
    </div>
  );
}

export default CategoryBreakdownCharts
