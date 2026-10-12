import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthContext from '../context/authContext.js';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import { LanguageProvider } from '../context/LanguageContext.jsx';
import Layout from './Layout.jsx';

function renderLayout(authValue, route = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthContext.Provider value={authValue}>
            <Routes>
              <Route path="/login" element={<p>Login page</p>} />
              <Route element={<Layout />}>
                <Route path="*" element={<p>Page content</p>} />
              </Route>
            </Routes>
          </AuthContext.Provider>
        </LanguageProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

function authFor(user) {
  return { user, isLoading: false, logout: vi.fn(), login: vi.fn(), signup: vi.fn() };
}

// The sidebar is the first navigation landmark; the phone's bottom nav follows it.
function sidebar() {
  return screen.getAllByRole('navigation')[0];
}

const SIDEBAR_PAGES = [
  ['/dashboard', 'Dashboard'],
  ['/transactions', 'Transactions'],
  ['/accounts', 'Accounts'],
  ['/budgets', 'Budgets'],
  ['/goals', 'Goals'],
  ['/recurring', 'Recurring Transactions'],
  ['/reports', 'Reports'],
  ['/finance-ai', 'Finance AI'],
  ['/calculator', 'Financial Calculator'],
  ['/billing', 'Plan & billing'],
];

describe('Layout', () => {
  it('calls logout and navigates to /login when Log Out is chosen from the account menu', async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    renderLayout({ user: { email: 'moha@test.com' }, isLoading: false, logout, login: vi.fn(), signup: vi.fn() });

    await userEvent.click(screen.getByRole('button', { name: /moha/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /log out/i }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });

  it('links to plan & billing once, from the sidebar, and shows the plan in the account menu', async () => {
    const user = { email: 'moha@test.com', createdAt: '2020-01-01T00:00:00Z', access: { plan: 'pro', hasAccess: true } };
    renderLayout(authFor(user));

    expect(within(sidebar()).getByRole('link', { name: /plan & billing/i })).toHaveAttribute('href', '/billing');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /moha/i }));

    const menu = screen.getByRole('menu');
    expect(within(menu).getByText('Pro')).toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: /plan & billing/i })).not.toBeInTheDocument();
  });

  it('lists every page exactly once in the sidebar', () => {
    renderLayout(authFor({ email: 'moha@test.com' }));

    const links = within(sidebar()).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual(SIDEBAR_PAGES.map(([route]) => route));
    expect(links.map((link) => link.textContent)).toEqual(SIDEBAR_PAGES.map(([, name]) => name));
  });

  it.each(SIDEBAR_PAGES)('highlights only the current page in the sidebar at %s', (route, name) => {
    renderLayout(authFor({ email: 'moha@test.com' }), route);

    const current = within(sidebar()).getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent(name);
    expect(current[0]).toHaveClass('active');
  });

  it('shows the Admin link to admins only', () => {
    const { unmount } = renderLayout(authFor({ email: 'moha@test.com' }));
    expect(within(sidebar()).queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
    unmount();

    renderLayout(authFor({ email: 'moha@test.com', isAdmin: true }), '/admin');
    expect(within(sidebar()).getByRole('link', { name: 'Admin' })).toHaveAttribute('aria-current', 'page');
  });

  it('collapses the sidebar to icons and remembers the choice', async () => {
    renderLayout(authFor({ email: 'moha@test.com' }));

    await userEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute('aria-expanded', 'false');
    expect(localStorage.getItem('sidebarCollapsed')).toBe('true');
    // Still named for screen readers, and by tooltip, while only the icon shows
    expect(within(sidebar()).getByRole('link', { name: 'Budgets' })).toHaveAttribute('title', 'Budgets');

    await userEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(localStorage.getItem('sidebarCollapsed')).toBe('false');
  });

  it('shows the letters of the email prefix as the username, never the full email', () => {
    const user = { email: 'moha.123@gmail.com', createdAt: '2020-01-01T00:00:00Z' };
    renderLayout(authFor(user));
    expect(screen.getAllByText('moha').length).toBeGreaterThan(0);
    expect(screen.queryByText(/moha\.123/)).not.toBeInTheDocument();
    expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument();
  });

  it('welcomes a user who registered within the last day', () => {
    const user = { email: 'moha.123@gmail.com', createdAt: new Date().toISOString() };
    renderLayout(authFor(user));
    expect(screen.getAllByText('Welcome, moha').length).toBeGreaterThan(0);
  });
});
