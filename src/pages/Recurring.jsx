import { useTranslation } from 'react-i18next'
import '../styles/shared.css'
import './Recurring.css'
import RecurringTransactionsSection from '../components/recurring/RecurringTransactionsSection.jsx'

function Recurring() {
  const { t } = useTranslation();

  return (
    <div className="recurring-page">
      <h1>{t('recurring.title')}</h1>
      <p className="subtitle">{t('recurring.subtitle')}</p>
      <RecurringTransactionsSection />
    </div>
  );
}

export default Recurring
