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

  it('renders the current user\'s email in the header', () => {
    renderLayout({ user: { email: 'a@test.com' }, isLoading: false, logout: vi.fn(), login: vi.fn(), signup: vi.fn() });
    expect(screen.getByText('a@test.com')).toBeInTheDocument();
  });
});
