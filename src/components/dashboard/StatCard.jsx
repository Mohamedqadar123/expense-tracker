function StatCard({ title, value, accent }) {
  return (
    <div className="stat-card">
      <h3>{title}</h3>
      <p className={`stat-value ${accent || ''}`}>{value}</p>
    </div>
  );
}

export default StatCard
