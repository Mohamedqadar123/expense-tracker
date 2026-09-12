import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'

function IncomeExpensesChart({ data }) {
  const hasData = data.some(d => d.income > 0 || d.expenses > 0);

  return (
    <div className="chart-card">
      <h3>Income vs Expenses</h3>
      {hasData ? (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bucket" fontSize={11} />
            <YAxis fontSize={12} />
            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            <Legend />
            <Bar dataKey="income" fill="#2e7d32" name="Income" />
            <Bar dataKey="expenses" fill="#c62828" name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="chart-empty">No transactions in this period.</p>
      )}
    </div>
  );
}

export default IncomeExpensesChart
