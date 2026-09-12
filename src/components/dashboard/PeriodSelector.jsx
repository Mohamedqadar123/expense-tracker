const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
  { key: 'custom', label: 'Custom' },
];

function PeriodSelector({ preset, customStart, customEnd, onChange }) {
  return (
    <div className="period-selector">
      <div className="period-presets">
        {PRESETS.map(p => (
          <button
            key={p.key}
            type="button"
            className={preset === p.key ? 'active' : ''}
            onClick={() => onChange({ preset: p.key })}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className="period-custom-range">
          <input
            type="date"
            value={customStart}
            onChange={(e) => onChange({ preset: 'custom', customStart: e.target.value, customEnd })}
          />
          <span>to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => onChange({ preset: 'custom', customStart, customEnd: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

export default PeriodSelector
