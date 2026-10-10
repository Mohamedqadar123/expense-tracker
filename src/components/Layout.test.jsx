import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthContext from '../context/authContext.js';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import { LanguageProvider } from '../context/LanguageContext.jsx';
import Layout from './Layout.jsx';

function renderLayout(authValue) {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthContext.Provider value={authValue}>
            <Routes>
              <Route path="/dashboard" element={<Layout />}>
                <Route index element={<p>Dashboard content</p>} />
              </Route>
              <Route path="/login" element={<p>Login page</p>} />
            </Routes>
          </AuthContext.Provider>
        </LanguageProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Layout', () => {
  it('calls logout and navigates to /login when the logout button is clicked', async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    renderLayout({ user: { email: 'a@test.com' }, isLoading: false, logout, login: vi.fn(), signup: vi.fn() });

    await userEvent.click(screen.getAllByRole('button', { name: /log out/i })[0]);

    expect(logout).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });

  it('shows the letters of the email prefix as the username, never the full email', () => {
    const user = { email: 'moha.123@gmail.com', createdAt: '2020-01-01T00:00:00Z' };
    renderLayout({ user, isLoading: false, logout: vi.fn(), login: vi.fn(), signup: vi.fn() });
    expect(screen.getAllByText('moha').length).toBeGreaterThan(0);
    expect(screen.queryByText(/moha\.123/)).not.toBeInTheDocument();
    expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument();
  });

  it('welcomes a user who registered within the last day', () => {
    const user = { email: 'moha.123@gmail.com', createdAt: new Date().toISOString() };
    renderLayout({ user, isLoading: false, logout: vi.fn(), login: vi.fn(), signup: vi.fn() });
    expect(screen.getAllByText('Welcome, moha').length).toBeGreaterThan(0);
  });
});
