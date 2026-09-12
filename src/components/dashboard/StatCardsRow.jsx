import StatCard from './StatCard.jsx'

function formatCurrency(n) {
  return `$${n.toFixed(2)}`;
}

function StatCardsRow({ summary }) {
  const { totalBalance, income, expenses, savings, savingsRate } = summary;

  return (
    <div className="stat-cards-row">
      <StatCard title="Total Balance" value={formatCurrency(totalBalance)} accent={totalBalance >= 0 ? 'positive' : 'negative'} />
      <StatCard title="Total Income" value={formatCurrency(income)} accent="positive" />
      <StatCard title="Total Expenses" value={formatCurrency(expenses)} accent="negative" />
      <StatCard title="Savings" value={formatCurrency(savings)} accent={savings >= 0 ? 'positive' : 'negative'} />
      <StatCard
        title="Savings Rate"
        value={savingsRate === null ? 'N/A' : `${savingsRate.toFixed(0)}%`}
        accent={savingsRate === null ? '' : savingsRate >= 0 ? 'positive' : 'negative'}
      />
    </div>
  );
}

export default StatCardsRow
