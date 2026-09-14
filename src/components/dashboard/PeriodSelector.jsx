import { useTranslation } from 'react-i18next'
import { DASHBOARD_PRESETS } from '../../constants/periodPresets'

function PeriodSelector({ preset, customStart, customEnd, onChange, presets = DASHBOARD_PRESETS }) {
  const { t } = useTranslation();

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
            {t(`periods.${p.key}`)}
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
          <span>{t('common.to')}</span>
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
