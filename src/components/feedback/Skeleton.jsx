import './Feedback.css'

// Grey placeholder blocks in the shape of what is loading, so the page does
// not jump when the data arrives. `label` is what a screen reader hears.

export function ListSkeleton({ label, rows = 3 }) {
  return (
    <div className="skeleton-list" role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="skeleton-row">
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-line skeleton-line-short" />
        </div>
      ))}
    </div>
  );
}

// The dashboard and reports pages: a row of stat cards over a grid of charts.
export function OverviewSkeleton({ label, cards = 5, charts = 3 }) {
  return (
    <div role="status" aria-label={label}>
      <div className="stat-cards-row">
        {Array.from({ length: cards }, (_, index) => (
          <div key={index} className="skeleton skeleton-card" />
        ))}
      </div>
      <div className={`dashboard-charts-grid ${charts === 2 ? 'dashboard-charts-grid--two' : ''}`}>
        {Array.from({ length: charts }, (_, index) => (
          <div key={index} className="skeleton skeleton-chart" />
        ))}
      </div>
    </div>
  );
}
