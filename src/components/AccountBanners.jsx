import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/useAuth.js'
import { resendVerification } from '../api/auth'

function AccountBanners() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [resendState, setResendState] = useState('idle');

  const handleResend = async () => {
    setResendState('sending');
    try {
      await resendVerification();
      setResendState('sent');
    } catch {
      setResendState('idle');
    }
  };

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
      {user && !user.emailVerifiedAt && (
        <div className="account-banner">
          <span>{resendState === 'sent' ? t('billing.resent') : t('billing.verifyBanner')}</span>
          {resendState !== 'sent' && (
            <button type="button" onClick={handleResend} disabled={resendState === 'sending'}>
              {t('billing.resend')}
            </button>
          )}
        </div>
      )}
    </>
  );
}

export default AccountBanners
