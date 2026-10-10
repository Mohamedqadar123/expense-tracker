import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './Layout.css'
import { useAuth } from '../context/useAuth.js'
import BottomNav from './BottomNav.jsx'
import BottomSheet from './BottomSheet.jsx'
import FloatingAddButton from './FloatingAddButton.jsx'
import QuickAddTransactionForm from './transactions/QuickAddTransactionForm.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import LanguageSelector from './LanguageSelector.jsx'
import AccountBanners from './AccountBanners.jsx'
import AccountMenu from './AccountMenu.jsx'
import { CATEGORIES } from '../constants/categories'
import { BUDGET_CATEGORIES } from '../constants/budgetCategories'
import { mergeCategories } from '../utils/mergeCategories'
import { getUsername, isNewUser } from '../utils/username'
import { UserIcon } from './icons/Icons.jsx'

const categories = mergeCategories(CATEGORIES, BUDGET_CATEGORIES);

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const username = getUsername(user?.email);
  // Greets accounts on their first day.
  const isWelcome = isNewUser(user?.createdAt);
  const userLabel = username && (
    <span className={`layout-username ${isWelcome ? 'layout-username-welcome' : ''}`}>
      <UserIcon />
      <span className="layout-username-text">
        {isWelcome ? t('common.welcome', { name: username }) : username}
      </span>
    </span>
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="layout-top">
          <span className="layout-brand">Finance Tracker</span>
          <div className="layout-user">
            <LanguageSelector />
            <ThemeToggle />
            <AccountMenu onLogout={handleLogout}>{userLabel}</AccountMenu>
          </div>
        </div>
        <nav className="layout-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            {t('nav.home')}
          </NavLink>
          <NavLink to="/transactions" className={({ isActive }) => isActive ? 'active' : ''}>
            {t('nav.transactions')}
          </NavLink>
          <NavLink to="/budgets" className={({ isActive }) => isActive ? 'active' : ''}>
            {t('nav.budgets')}
          </NavLink>
          <NavLink to="/accounts" className={({ isActive }) => isActive ? 'active' : ''}>
            {t('nav.accounts')}
          </NavLink>
          <NavLink to="/goals" className={({ isActive }) => isActive ? 'active' : ''}>
            {t('nav.goals')}
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
            {t('nav.reports')}
          </NavLink>
          <NavLink to="/recurring" className={({ isActive }) => isActive ? 'active' : ''}>
            {t('nav.recurring')}
          </NavLink>
          <NavLink to="/finance-ai" className={({ isActive }) => isActive ? 'active' : ''}>
            {t('nav.financeAI')}
          </NavLink>
          <NavLink to="/calculator" className={({ isActive }) => isActive ? 'active' : ''}>
            {t('nav.calculator')}
          </NavLink>
          {user?.isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
              {t('nav.admin')}
            </NavLink>
          )}
        </nav>
      </header>

      <AccountBanners />

      <main className="layout-main">
        <Outlet />
      </main>

      <BottomNav onMoreClick={() => setIsMoreOpen(true)} />
      <FloatingAddButton onClick={() => setIsQuickAddOpen(true)} />

      <BottomSheet isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} title={t('nav.more')}>
        <nav className="more-sheet-nav">
          <NavLink to="/accounts" onClick={() => setIsMoreOpen(false)}>{t('nav.accounts')}</NavLink>
          <NavLink to="/reports" onClick={() => setIsMoreOpen(false)}>{t('nav.reports')}</NavLink>
          <NavLink to="/recurring" onClick={() => setIsMoreOpen(false)}>{t('nav.recurring')}</NavLink>
          <NavLink to="/finance-ai" onClick={() => setIsMoreOpen(false)}>{t('nav.financeAI')}</NavLink>
          <NavLink to="/calculator" onClick={() => setIsMoreOpen(false)}>{t('nav.calculator')}</NavLink>
          <NavLink to="/billing" onClick={() => setIsMoreOpen(false)}>{t('nav.billing')}</NavLink>
          {user?.isAdmin && (
            <NavLink to="/admin" onClick={() => setIsMoreOpen(false)}>{t('nav.admin')}</NavLink>
          )}
          <button type="button" className="more-sheet-logout" onClick={handleLogout}>{t('common.logOut')}</button>
          {userLabel}
        </nav>
        <div className="more-sheet-theme">
          <span className="more-sheet-theme-label">{t('theme.label')}</span>
          <ThemeToggle className="theme-toggle-full" />
        </div>
        <div className="more-sheet-language">
          <span className="more-sheet-language-label">{t('language.label')}</span>
          <LanguageSelector className="language-selector-full" />
        </div>
      </BottomSheet>

      <BottomSheet isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} title={t('nav.addTransaction')}>
        <QuickAddTransactionForm
          categories={categories}
          onSuccess={() => setIsQuickAddOpen(false)}
        />
      </BottomSheet>
    </div>
  );
}

export default Layout
