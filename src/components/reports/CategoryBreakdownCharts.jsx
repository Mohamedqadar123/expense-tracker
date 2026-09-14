import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/useTheme.js'
import { getChartColors, getTooltipStyle } from '../../theme/chartColors.js'

function CategoryPie({ title, data, emptyMessage }) {
  const { resolvedTheme } = useTheme();
  const colors = getChartColors(resolvedTheme);
  const hasData = data.length > 0;
  return (
    <div className="chart-card">
      <h3>{title}</h3>
      {hasData ? (
        <div className="chart-container chart-container--pie">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="amount" nameKey="category" outerRadius="70%" label={{ fill: colors.legendText }}>
                {data.map((entry, index) => (
                  <Cell key={entry.category} fill={colors.categorical[index % colors.categorical.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} {...getTooltipStyle(colors)} />
              <Legend wrapperStyle={{ color: colors.legendText, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="chart-empty">{emptyMessage}</p>
      )}
    </div>
  );
}

function CategoryBreakdownCharts({ expenseByCategory, incomeByCategory }) {
  const { t } = useTranslation();

  return (
    <div className="dashboard-charts-grid">
      <CategoryPie title={t('reports.expenseByCategory')} data={expenseByCategory} emptyMessage={t('dashboard.noExpensesPeriod')} />
      <CategoryPie title={t('reports.incomeByCategory')} data={incomeByCategory} emptyMessage={t('reports.noIncomePeriod')} />
    </div>
  );
}

export default CategoryBreakdownCharts
