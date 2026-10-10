import { Link, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/useAuth.js'
import '../styles/shared.css'
import { LockIllustration } from './illustrations/Illustrations.jsx'

// Wraps routes that only the Pro plan (or the free trial) includes. The API
// enforces the same rule (402); this replaces the page with an upgrade
// prompt instead of letting it load and fail.
function ProRoute() {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (user?.access?.hasFinanceAI) {
    return <Outlet />;
  }

  return (
    <div className="section-card upgrade-gate">
      <LockIllustration />
      <h2>{t('billing.gateTitle')}</h2>
      <p>{t('billing.gateBody')}</p>
      <Link to="/billing" className="upgrade-gate-link">{t('billing.upgrade')}</Link>
    </div>
  );
}

export default ProRoute
