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
import { CATEGORIES } from '../constants/categories'
import { BUDGET_CATEGORIES } from '../constants/budgetCategories'
import { mergeCategories } from '../utils/mergeCategories'

const categories = mergeCategories(CATEGORIES, BUDGET_CATEGORIES);

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="layout-header">
        <span className="layout-brand">Finance Tracker</span>
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
        </nav>
        <div className="layout-user">
          <ThemeToggle />
          <LanguageSelector />
          <span className="layout-user-email">{user?.name || user?.email}</span>
          <button type="button" onClick={handleLogout}>{t('common.logOut')}</button>
        </div>
      </header>

      <main className="layout-main">
        <Outlet />
      </main>

      <BottomNav onMoreClick={() => setIsMoreOpen(true)} />
      <FloatingAddButton onClick={() => setIsQuickAddOpen(true)} />

      <BottomSheet isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} title={t('nav.more')}>
        <nav className="more-sheet-nav">
          <NavLink to="/reports" onClick={() => setIsMoreOpen(false)}>{t('nav.reports')}</NavLink>
          <NavLink to="/recurring" onClick={() => setIsMoreOpen(false)}>{t('nav.recurring')}</NavLink>
          <NavLink to="/finance-ai" onClick={() => setIsMoreOpen(false)}>{t('nav.financeAI')}</NavLink>
          <button type="button" className="more-sheet-logout" onClick={handleLogout}>{t('common.logOut')}</button>
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
