import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/useTheme.js'
import { getChartColors, getTooltipStyle } from '../../theme/chartColors.js'

function CashFlowCharts({ dailyCashFlow, monthlyCashFlow }) {
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const colors = getChartColors(resolvedTheme);
  const hasDaily = dailyCashFlow.some(d => d.income > 0 || d.expenses > 0);
  const hasMonthly = monthlyCashFlow.some(m => m.income > 0 || m.expenses > 0);

  return (
    <div className="dashboard-charts-grid">
      <div className="chart-card">
        <h3>{t('reports.dailyCashFlow')}</h3>
        {hasDaily ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyCashFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="date" fontSize={11} stroke={colors.axis} />
                <YAxis fontSize={12} stroke={colors.axis} />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} {...getTooltipStyle(colors)} />
                <Legend wrapperStyle={{ color: colors.legendText, fontSize: 13 }} />
                <Line type="monotone" dataKey="income" stroke={colors.income} name={t('common.income')} dot={false} />
                <Line type="monotone" dataKey="expenses" stroke={colors.expense} name={t('common.expense')} dot={false} />
                <Line type="monotone" dataKey="net" stroke={colors.net} name={t('reports.netSavings')} dot={false} />
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
              <BarChart data={monthlyCashFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="month" fontSize={12} stroke={colors.axis} />
                <YAxis fontSize={12} stroke={colors.axis} />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} {...getTooltipStyle(colors)} />
                <Legend wrapperStyle={{ color: colors.legendText, fontSize: 13 }} />
                <Bar dataKey="income" fill={colors.income} name={t('common.income')} />
                <Bar dataKey="expenses" fill={colors.expense} name={t('common.expense')} />
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
