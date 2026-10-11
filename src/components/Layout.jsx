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
import {
  UserIcon, PlusIcon, HomeIcon, ListIcon, CardIcon, WalletIcon, TargetIcon,
  RepeatIcon, ChartIcon, SparklesIcon, CalculatorIcon, ShieldIcon,
} from './icons/Icons.jsx'
import { useFeedback } from '../context/useFeedback.js'

const categories = mergeCategories(CATEGORIES, BUDGET_CATEGORIES);

// The desktop sidebar: every page, grouped by what it is for. Budgets and
// Goals keep the icons they have in the phone's bottom nav.
const NAV_GROUPS = [
  {
    label: 'nav.groupMoney',
    items: [
      { to: '/dashboard', label: 'nav.home', icon: <HomeIcon /> },
      { to: '/transactions', label: 'nav.transactions', icon: <ListIcon /> },
      { to: '/accounts', label: 'nav.accounts', icon: <CardIcon /> },
    ],
  },
  {
    label: 'nav.groupPlanning',
    items: [
      { to: '/budgets', label: 'nav.budgets', icon: <WalletIcon /> },
      { to: '/goals', label: 'nav.goals', icon: <TargetIcon /> },
      { to: '/recurring', label: 'nav.recurring', icon: <RepeatIcon /> },
    ],
  },
  {
    label: 'nav.groupInsights',
    items: [
      { to: '/reports', label: 'nav.reports', icon: <ChartIcon /> },
      { to: '/finance-ai', label: 'nav.financeAI', icon: <SparklesIcon /> },
      { to: '/calculator', label: 'nav.calculator', icon: <CalculatorIcon /> },
    ],
  },
];

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { notify } = useFeedback();
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
        <span className="layout-brand">Finance Tracker</span>
        <div className="layout-user">
          <button type="button" className="layout-add-button" onClick={() => setIsQuickAddOpen(true)}>
            <PlusIcon />
            <span>{t('nav.addTransaction')}</span>
          </button>
          <LanguageSelector />
          <ThemeToggle />
          <AccountMenu onLogout={handleLogout}>{userLabel}</AccountMenu>
        </div>
      </header>

      <AccountBanners />

      <div className="layout-body">
        <nav className="layout-nav">
          <div className="layout-nav-inner">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="layout-nav-group">
                <span className="layout-nav-group-label">{t(group.label)}</span>
                {group.items.map(({ to, label, icon }) => (
                  <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}>
                    {icon}
                    <span>{t(label)}</span>
                  </NavLink>
                ))}
              </div>
            ))}
            {user?.isAdmin && (
              <div className="layout-nav-group">
                <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
                  <ShieldIcon />
                  <span>{t('nav.admin')}</span>
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        <main className="layout-main">
          <Outlet />
        </main>
      </div>

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
          onSuccess={() => { setIsQuickAddOpen(false); notify(t('feedback.added')); }}
        />
      </BottomSheet>
    </div>
  );
}

export default Layout
