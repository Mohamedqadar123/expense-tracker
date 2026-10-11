// One headline figure. Only `title` and `value` are required; the rest are
// optional extras: an `icon` (with `iconTone`: success, danger, info or
// neutral), a `hint` explaining what the figure means, and a `trend`
// ({ label, tone }) comparing it with an earlier period.
function StatCard({ title, value, accent, icon, iconTone = 'neutral', hint, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <h3>{title}</h3>
        {icon && <span className={`stat-icon stat-icon-${iconTone}`} aria-hidden="true">{icon}</span>}
      </div>
      <p className={`stat-value ${accent || ''}`}>{value}</p>
      {hint && <p className="stat-hint">{hint}</p>}
      {trend && <p className={`stat-trend stat-trend-${trend.tone}`}>{trend.label}</p>}
    </div>
  );
}

export default StatCard
