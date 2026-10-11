import { useTranslation } from 'react-i18next'
import '../styles/shared.css'
import './Accounts.css'
import AccountsSection from '../components/accounts/AccountsSection.jsx'

function Accounts() {
  const { t } = useTranslation();

  return (
    <div className="accounts-page">
      <h1>{t('accounts.title')}</h1>
      <p className="subtitle">{t('accounts.subtitle')}</p>
      <AccountsSection />
    </div>
  );
}

export default Accounts
