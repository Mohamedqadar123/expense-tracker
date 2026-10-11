import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/useTheme.js'
import { getChartColors, getTooltipStyle } from '../../theme/chartColors.js'
import { formatCurrency } from '../../utils/format'
import { toWholePercents, formatShare } from '../../utils/shares'

// One slice per colour in the palette: beyond that, two categories would
// share a colour and be impossible to tell apart.
const MAX_SLICES = 7;

// Largest first; only categories that were actually spent on. When there are
// more than fit, the smallest are added together into one last slice.
function toSlices(data, otherLabel) {
  const spent = data.filter((entry) => entry.amount > 0).sort((a, b) => b.amount - a.amount);
  if (spent.length <= MAX_SLICES) return spent;
  const rest = spent.slice(MAX_SLICES - 1);
  return [
    ...spent.slice(0, MAX_SLICES - 1),
    { category: otherLabel, amount: rest.reduce((sum, entry) => sum + entry.amount, 0) },
  ];
}

// Where the period's spending went: a ring with the total in the middle and,
// under it, every category with its amount and share. `data` is the API's
// list of { category, amount } for the selected period. The wording defaults
// to spending; the reports page passes its own for the income breakdown.
function SpendingByCategoryChart({ data, title, totalLabel, emptyMessage }) {
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const colors = getChartColors(resolvedTheme);

  const slices = toSlices(data, t('dashboard.otherCategories'));
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  const percents = toWholePercents(slices.map((slice) => slice.amount));
  const rows = slices.map((slice, index) => ({
    ...slice,
    share: formatShare(percents[index], slice.amount),
    color: colors.categorical[index % colors.categorical.length],
  }));

  return (
    <div className="chart-card">
      <h3>{title || t('dashboard.spendingByCategory')}</h3>
      {rows.length > 0 ? (
        <>
          <div className="donut">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius="68%"
                  outerRadius="100%"
                  paddingAngle={rows.length > 1 ? 2 : 0}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {rows.map((row) => <Cell key={row.category} fill={row.color} />)}
                </Pie>
                <Tooltip
                  formatter={(value, name, item) => [`${formatCurrency(value)} (${item.payload.share})`, name]}
                  {...getTooltipStyle(colors)}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <span className="donut-center-label">{totalLabel || t('dashboard.totalSpent')}</span>
              <strong className="donut-center-value">{formatCurrency(total)}</strong>
            </div>
          </div>
          <ul className="category-legend">
            {rows.map((row) => (
              <li key={row.category}>
                <span className="chart-dot" style={{ background: row.color }} />
                <span className="category-legend-name">{row.category}</span>
                <span className="category-legend-amount">{formatCurrency(row.amount)}</span>
                <span className="category-legend-share">{row.share}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="chart-empty">{emptyMessage || t('dashboard.noExpensesPeriod')}</p>
      )}
    </div>
  );
}

export default SpendingByCategoryChart
