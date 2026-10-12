import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
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
  UserIcon, PlusIcon, HomeIcon, ListIcon, BankIcon, WalletIcon, TargetIcon, RepeatIcon,
  ChartIcon, SparklesIcon, CalculatorIcon, CardIcon, ShieldIcon, ChevronLeftIcon,
} from './icons/Icons.jsx'
import { useFeedback } from '../context/useFeedback.js'

const categories = mergeCategories(CATEGORIES, BUDGET_CATEGORIES);

const COLLAPSED_KEY = 'sidebarCollapsed';

// Pages with their own, larger Add Transaction button beside their title;
// the top bar leaves its one out there.
const PAGES_WITH_OWN_ADD_BUTTON = ['/dashboard', '/transactions'];

function getStoredCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

// The desktop sidebar: every page of the app exactly once, grouped by what
// it is for. Budgets and Goals keep the icons they have in the phone's
// bottom nav. The Admin link is added to Settings for admins only.
const NAV_GROUPS = [
  {
    label: 'nav.groupOverview',
    items: [
      { to: '/dashboard', label: 'dashboard.title', icon: <HomeIcon /> },
    ],
  },
  {
    label: 'nav.groupMoney',
    items: [
      { to: '/transactions', label: 'nav.transactions', icon: <ListIcon /> },
      { to: '/accounts', label: 'nav.accounts', icon: <BankIcon /> },
      { to: '/budgets', label: 'nav.budgets', icon: <WalletIcon /> },
    ],
  },
  {
    label: 'nav.groupPlanning',
    items: [
      { to: '/goals', label: 'nav.goals', icon: <TargetIcon /> },
      { to: '/recurring', label: 'recurring.title', icon: <RepeatIcon /> },
    ],
  },
  {
    label: 'nav.groupAnalytics',
    items: [
      { to: '/reports', label: 'nav.reports', icon: <ChartIcon /> },
      { to: '/finance-ai', label: 'nav.financeAI', icon: <SparklesIcon /> },
    ],
  },
  {
    label: 'nav.groupTools',
    items: [
      { to: '/calculator', label: 'nav.financialCalculator', icon: <CalculatorIcon /> },
    ],
  },
  {
    label: 'nav.groupSettings',
    items: [
      { to: '/billing', label: 'nav.billing', icon: <CardIcon /> },
      { to: '/admin', label: 'nav.admin', icon: <ShieldIcon />, adminOnly: true },
    ],
  },
];

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { notify } = useFeedback();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  // Desktop only: the sidebar narrows to its icons. Remembered per browser.
  const [isCollapsed, setIsCollapsed] = useState(getStoredCollapsed);
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

  // A page can ask for the add-transaction form without owning it.
  useEffect(() => {
    const handleOpen = () => setIsQuickAddOpen(true);
    window.addEventListener('quick-add:open', handleOpen);
    return () => window.removeEventListener('quick-add:open', handleOpen);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    try {
      localStorage.setItem(COLLAPSED_KEY, String(next));
    } catch {
      // ignore — storage unavailable; the choice still applies for this session
    }
    setIsCollapsed(next);
  };

  return (
    <div className={`layout ${isCollapsed ? 'layout-collapsed' : ''}`}>
      <nav className="layout-nav">
        <div className="layout-nav-top">
          <span className="layout-nav-logo" aria-hidden="true"><ChartIcon /></span>
          <span className="layout-nav-brand layout-nav-text">Finance Tracker</span>
          <button
            type="button"
            className="layout-nav-toggle"
            onClick={toggleCollapsed}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
            title={isCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
          >
            <ChevronLeftIcon />
          </button>
        </div>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="layout-nav-group">
            <span className="layout-nav-group-label">{t(group.label)}</span>
            {group.items.filter((item) => !item.adminOnly || user?.isAdmin).map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => isActive ? 'active' : ''}
                title={isCollapsed ? t(label) : undefined}
              >
                {icon}
                <span className="layout-nav-text">{t(label)}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="layout-content">
        <header className="layout-header">
          <span className="layout-brand">Finance Tracker</span>
          <div className="layout-user">
            {!PAGES_WITH_OWN_ADD_BUTTON.includes(pathname) && (
              <button type="button" className="layout-add-button" onClick={() => setIsQuickAddOpen(true)}>
                <PlusIcon />
                <span>{t('nav.addTransaction')}</span>
              </button>
            )}
            <LanguageSelector />
            <ThemeToggle />
            <AccountMenu onLogout={handleLogout}>{userLabel}</AccountMenu>
          </div>
        </header>

        <AccountBanners />

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
          onCancel={() => setIsQuickAddOpen(false)}
        />
      </BottomSheet>
    </div>
  );
}

export default Layout
