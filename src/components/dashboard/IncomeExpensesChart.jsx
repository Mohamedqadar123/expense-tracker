import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/useTheme.js'
import { getChartColors, getTooltipStyle } from '../../theme/chartColors.js'

function IncomeExpensesChart({ data }) {
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const colors = getChartColors(resolvedTheme);
  const hasData = data.some(d => d.income > 0 || d.expenses > 0);

  return (
    <div className="chart-card">
      <h3>{t('dashboard.incomeVsExpenses')}</h3>
      {hasData ? (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="bucket" fontSize={11} stroke={colors.axis} />
              <YAxis fontSize={12} stroke={colors.axis} />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} {...getTooltipStyle(colors)} />
              <Legend wrapperStyle={{ color: colors.legendText, fontSize: 13 }} />
              <Bar dataKey="income" fill={colors.income} name={t('common.income')} />
              <Bar dataKey="expenses" fill={colors.expense} name={t('common.expense')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="chart-empty">{t('dashboard.noTransactionsPeriod')}</p>
      )}
    </div>
  );
}

export default IncomeExpensesChart
