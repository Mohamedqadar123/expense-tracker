import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/useAuth.js'

// The signed-in person's menu at the end of the top bar: who they are, the
// plan they are on, and the account actions (plan & billing, log out). The
// `children` are the username label shown on the button.
function AccountMenu({ children, onLogout }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e) => {
      if (!menuRef.current?.contains(e.target)) setIsOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const plan = user?.access?.plan;
  const planNames = {
    trial: t('billing.planTrial'),
    standard: t('billing.planStandard'),
    pro: t('billing.planPro'),
    expired: t('billing.planExpired'),
  };

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        type="button"
        className="account-menu-button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {children}
        {plan && <span className={`account-menu-plan account-menu-plan-${plan}`}>{planNames[plan]}</span>}
        <span className="account-menu-caret" aria-hidden="true">▾</span>
      </button>
      {isOpen && (
        <div className="account-menu-list" role="menu">
          {plan && (
            <p className="account-menu-current">
              {t('billing.currentPlan')}: <strong>{planNames[plan]}</strong>
            </p>
          )}
          <Link to="/billing" role="menuitem" onClick={() => setIsOpen(false)}>
            {t('nav.billing')}
          </Link>
          <button type="button" role="menuitem" onClick={onLogout}>
            {t('common.logOut')}
          </button>
        </div>
      )}
    </div>
  );
}

export default AccountMenu
