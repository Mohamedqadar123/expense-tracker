import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/useTheme.js'
import { getChartColors, getTooltipStyle } from '../../theme/chartColors.js'

function MonthlySpendingTrendChart({ data }) {
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const colors = getChartColors(resolvedTheme);
  const hasData = data.some(d => d.amount > 0);

  return (
    <div className="chart-card">
      <h3>{t('dashboard.monthlySpending')}</h3>
      {hasData ? (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="month" fontSize={12} stroke={colors.axis} />
              <YAxis fontSize={12} stroke={colors.axis} />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} {...getTooltipStyle(colors)} />
              <Bar dataKey="amount" fill={colors.neutral} name={t('common.expense')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="chart-empty">{t('dashboard.noExpenses6mo')}</p>
      )}
    </div>
  );
}

export default MonthlySpendingTrendChart
