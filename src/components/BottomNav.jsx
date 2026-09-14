import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './BottomNav.css'
import { HomeIcon, ListIcon, WalletIcon, TargetIcon, MoreIcon } from './icons/Icons.jsx'

function BottomNav({ onMoreClick }) {
  const { t } = useTranslation();

  return (
    <nav className="bottom-nav">
      <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
        <HomeIcon />
        <span>{t('nav.home')}</span>
      </NavLink>
      <NavLink to="/transactions" className={({ isActive }) => isActive ? 'active' : ''}>
        <ListIcon />
        <span>{t('nav.transactions')}</span>
      </NavLink>
      <NavLink to="/budgets" className={({ isActive }) => isActive ? 'active' : ''}>
        <WalletIcon />
        <span>{t('nav.budgets')}</span>
      </NavLink>
      <NavLink to="/goals" className={({ isActive }) => isActive ? 'active' : ''}>
        <TargetIcon />
        <span>{t('nav.goals')}</span>
      </NavLink>
      <button type="button" className="bottom-nav-more" onClick={onMoreClick}>
        <MoreIcon />
        <span>{t('nav.more')}</span>
      </button>
    </nav>
  );
}

export default BottomNav
