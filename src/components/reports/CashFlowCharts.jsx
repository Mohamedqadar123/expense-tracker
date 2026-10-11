import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/useTheme.js'
import { getChartColors, getTooltipStyle } from '../../theme/chartColors.js'
import { formatCurrency, formatCurrencyCompact, formatBucketLabel } from '../../utils/format'

function CashFlowCharts({ dailyCashFlow, monthlyCashFlow }) {
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const colors = getChartColors(resolvedTheme);
  const hasDaily = dailyCashFlow.some(d => d.income > 0 || d.expenses > 0);
  const hasMonthly = monthlyCashFlow.some(m => m.income > 0 || m.expenses > 0);

  // Shared by both charts: readable dates, compact currency, exact values on hover
  const axis = { fontSize: 12, stroke: colors.axis, tickLine: false };
  const valueAxis = <YAxis {...axis} axisLine={false} width={52} tickFormatter={formatCurrencyCompact} />;
  const tooltip = (
    <Tooltip
      formatter={(value) => formatCurrency(value)}
      labelFormatter={formatBucketLabel}
      {...getTooltipStyle(colors)}
    />
  );
  const legend = <Legend wrapperStyle={{ color: colors.legendText, fontSize: 13 }} />;

  return (
    <div className="dashboard-charts-grid reports-charts-grid">
      <div className="chart-card">
        <h3>{t('reports.dailyCashFlow')}</h3>
        {hasDaily ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyCashFlow} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                <XAxis dataKey="date" {...axis} tickFormatter={formatBucketLabel} minTickGap={16} />
                {valueAxis}
                {tooltip}
                {legend}
                <Line type="monotone" dataKey="income" stroke={colors.income} name={t('common.income')} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="expenses" stroke={colors.expense} name={t('common.expense')} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="net" stroke={colors.net} name={t('reports.netSavings')} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="chart-empty">{t('dashboard.noTransactionsPeriod')}</p>
        )}
      </div>

      <div className="chart-card">
        <h3>{t('reports.monthlyCashFlow')}</h3>
        {hasMonthly ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCashFlow} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                <XAxis dataKey="month" {...axis} tickFormatter={formatBucketLabel} minTickGap={16} />
                {valueAxis}
                {tooltip}
                {legend}
                <Bar dataKey="income" fill={colors.income} name={t('common.income')} radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive={false} />
                <Bar dataKey="expenses" fill={colors.expense} name={t('common.expense')} radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="chart-empty">{t('reports.noTransactions6mo')}</p>
        )}
      </div>
    </div>
  );
}

export default CashFlowCharts
