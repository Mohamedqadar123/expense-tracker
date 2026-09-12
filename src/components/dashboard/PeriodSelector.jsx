import { DASHBOARD_PRESETS } from '../../constants/periodPresets'

function PeriodSelector({ preset, customStart, customEnd, onChange, presets = DASHBOARD_PRESETS }) {
  return (
    <div className="period-selector">
      <div className="period-presets">
        {presets.map(p => (
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
