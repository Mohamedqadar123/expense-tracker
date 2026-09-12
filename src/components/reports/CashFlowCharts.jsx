import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

function CashFlowCharts({ dailyCashFlow, monthlyCashFlow }) {
  const hasDaily = dailyCashFlow.some(d => d.income > 0 || d.expenses > 0);
  const hasMonthly = monthlyCashFlow.some(m => m.income > 0 || m.expenses > 0);

  return (
    <div className="dashboard-charts-grid">
      <div className="chart-card">
        <h3>Daily Cash Flow</h3>
        {hasDaily ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dailyCashFlow}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={11} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#2e7d32" name="Income" dot={false} />
              <Line type="monotone" dataKey="expenses" stroke="#c62828" name="Expenses" dot={false} />
              <Line type="monotone" dataKey="net" stroke="#1565c0" name="Net" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="chart-empty">No transactions in this period.</p>
        )}
      </div>

      <div className="chart-card">
        <h3>Monthly Cash Flow (Last 6 Months)</h3>
        {hasMonthly ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyCashFlow}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="income" fill="#2e7d32" name="Income" />
              <Bar dataKey="expenses" fill="#c62828" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="chart-empty">No transactions in the last 6 months.</p>
        )}
      </div>
    </div>
  );
}

export default CashFlowCharts
