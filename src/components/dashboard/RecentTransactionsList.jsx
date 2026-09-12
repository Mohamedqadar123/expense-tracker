function RecentTransactionsList({ transactions }) {
  return (
    <div className="list-card">
      <h3>Recent Transactions</h3>
      {transactions.length === 0 ? (
        <p className="list-empty">No transactions in this period.</p>
      ) : (
        <ul className="recent-transactions">
          {transactions.map(t => (
            <li key={t.id}>
              <div>
                <span className="rt-description">{t.description}</span>
                <span className="rt-date">{t.date.slice(0, 10)}</span>
              </div>
              <span className={t.type === 'income' ? 'income-amount' : 'expense-amount'}>
                {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RecentTransactionsList
