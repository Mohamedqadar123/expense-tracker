import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/useTheme.js'
import { getChartColors, getTooltipStyle } from '../../theme/chartColors.js'
import { formatCurrency, formatCurrencyCompact, formatBucketLabel } from '../../utils/format'

// Income beside expenses for each slice of the selected period. `data` is
// the API's own list of buckets (hours for a single day, days up to a month,
// months beyond that), which already includes the empty ones, so a quiet
// day or month shows as a gap rather than disappearing from the axis.
function IncomeExpensesChart({ data }) {
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const colors = getChartColors(resolvedTheme);
  // The totals above the chart are the sum of what it draws, so the two
  // can never disagree; they also serve as its legend.
  const totals = data.reduce(
    (sum, bucket) => ({ income: sum.income + bucket.income, expenses: sum.expenses + bucket.expenses }),
    { income: 0, expenses: 0 }
  );
  const hasData = totals.income > 0 || totals.expenses > 0;

  return (
    <div className="chart-card">
      <h3>{t('dashboard.incomeVsExpenses')}</h3>
      {hasData ? (
        <>
          <ul className="chart-totals">
            <li>
              <span className="chart-dot" style={{ background: colors.income }} />
              <span>{t('common.income')}</span>
              <strong>{formatCurrency(totals.income)}</strong>
            </li>
            <li>
              <span className="chart-dot" style={{ background: colors.expense }} />
              <span>{t('common.expense')}</span>
              <strong>{formatCurrency(totals.expenses)}</strong>
            </li>
          </ul>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                <XAxis
                  dataKey="bucket"
                  fontSize={12}
                  stroke={colors.axis}
                  tickLine={false}
                  tickFormatter={formatBucketLabel}
                  minTickGap={16}
                />
                <YAxis
                  fontSize={12}
                  stroke={colors.axis}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  tickFormatter={formatCurrencyCompact}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={formatBucketLabel}
                  cursor={{ fill: colors.grid, opacity: 0.35 }}
                  {...getTooltipStyle(colors)}
                />
                <Bar dataKey="income" fill={colors.income} name={t('common.income')} radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive={false} />
                <Bar dataKey="expenses" fill={colors.expense} name={t('common.expense')} radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <p className="chart-empty">{t('dashboard.noTransactionsPeriod')}</p>
      )}
    </div>
  );
}

export default IncomeExpensesChart
