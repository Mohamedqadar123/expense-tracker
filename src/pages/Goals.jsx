import { useTranslation } from 'react-i18next'
import '../styles/shared.css'
import './Goals.css'
import SavingsGoalsSection from '../components/dashboard/SavingsGoalsSection.jsx'

function Goals() {
  const { t } = useTranslation();

  return (
    <div className="goals-page">
      <h1>{t('goals.title')}</h1>
      <p className="subtitle">{t('goals.subtitle')}</p>
      <SavingsGoalsSection />
    </div>
  );
}

export default Goals
