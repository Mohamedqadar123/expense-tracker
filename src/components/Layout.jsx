import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import './Layout.css'
import { useAuth } from '../context/useAuth.js'

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
            Dashboard
          </NavLink>
          <NavLink to="/transactions" className={({ isActive }) => isActive ? 'active' : ''}>
            Transactions
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
            Reports
          </NavLink>
        </nav>
        <div className="layout-user">
          <span className="layout-user-email">{user?.name || user?.email}</span>
          <button type="button" onClick={handleLogout}>Log Out</button>
        </div>
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout
