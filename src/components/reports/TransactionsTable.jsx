function TransactionsTable({ transactions }) {
  return (
    <div className="section-card">
      <h2>Transactions</h2>
      {transactions.length === 0 ? (
        <p className="list-empty">No transactions in this period.</p>
      ) : (
        <div className="reports-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td>{t.date.slice(0, 10)}</td>
                  <td>{t.description}</td>
                  <td>{t.category}</td>
                  <td>{t.type}</td>
                  <td className={t.type === 'income' ? 'income-amount' : 'expense-amount'}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TransactionsTable
