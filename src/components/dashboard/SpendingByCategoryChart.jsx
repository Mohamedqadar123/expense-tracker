import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#333', '#c62828', '#2e7d32', '#1565c0', '#f9a825', '#6a1b9a', '#00838f'];

function SpendingByCategoryChart({ data }) {
  const hasData = data.length > 0;

  return (
    <div className="chart-card">
      <h3>Spending by Category</h3>
      {hasData ? (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} dataKey="amount" nameKey="category" outerRadius={80} label>
              {data.map((entry, index) => (
                <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="chart-empty">No expenses in this period.</p>
      )}
    </div>
  );
}

export default SpendingByCategoryChart
