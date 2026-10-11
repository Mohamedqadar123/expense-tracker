import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/useAuth.js'

function AccountBanners() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const access = user?.access;
  const formatDate = (value) => new Date(value).toLocaleDateString(i18n.language);

  return (
    <>
      {access?.plan === 'trial' && (
        <div className="account-banner">
          <span>{t('billing.trialEnds', { date: formatDate(access.trialEndsAt) })}</span>
          <Link to="/billing">{t('billing.subscribe')}</Link>
        </div>
      )}
      {access?.plan === 'expired' && (
        <div className="account-banner account-banner-warning">
          <span>{t('billing.expired')}</span>
          <Link to="/billing">{t('billing.subscribe')}</Link>
        </div>
      )}
    </>
  );
}

export default AccountBanners
