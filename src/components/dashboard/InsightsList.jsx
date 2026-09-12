function InsightsList({ insights }) {
  return (
    <div className="list-card">
      <h3>Financial Insights</h3>
      {insights.length === 0 ? (
        <p className="list-empty">No insights yet.</p>
      ) : (
        <ul className="insights-list">
          {insights.map(i => (
            <li key={i.id} className={`insight-${i.tone}`}>{i.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default InsightsList
