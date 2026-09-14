import { useTranslation } from 'react-i18next'
import '../styles/shared.css'
import './Budgets.css'
import BudgetsSection from '../components/dashboard/BudgetsSection.jsx'

function Budgets() {
  const { t } = useTranslation();

  return (
    <div className="budgets-page">
      <h1>{t('budgets.title')}</h1>
      <p className="subtitle">{t('budgets.subtitle')}</p>
      <BudgetsSection />
    </div>
  );
}

export default Budgets
