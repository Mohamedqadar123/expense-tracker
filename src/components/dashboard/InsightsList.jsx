import { useTranslation } from 'react-i18next'

function InsightsList({ insights }) {
  const { t } = useTranslation();

  return (
    <div className="list-card">
      <h3>{t('dashboard.financialInsights')}</h3>
      {insights.length === 0 ? (
        <p className="list-empty">{t('dashboard.noInsights')}</p>
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
