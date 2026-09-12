import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function MonthlySpendingTrendChart({ data }) {
  const hasData = data.some(d => d.amount > 0);

  return (
    <div className="chart-card">
      <h3>Monthly Spending</h3>
      {hasData ? (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            <Bar dataKey="amount" fill="#333" name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="chart-empty">No expenses in the last 6 months.</p>
      )}
    </div>
  );
}

export default MonthlySpendingTrendChart
