import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '../testUtils/renderWithProviders.jsx';
import VerifyEmail from './VerifyEmail.jsx';
import { verifyEmail } from '../api/auth';

vi.mock('../api/auth', () => ({ verifyEmail: vi.fn() }));

const account = { id: 7, email: 'new@test.com' };

function renderLink(route, auth = {}) {
  const authValue = {
    user: null,
    isLoading: false,
    signInAs: vi.fn(),
    refreshUser: vi.fn().mockRejectedValue(new Error('Unauthorized')),
    ...auth,
  };
  renderWithProviders(
    <Routes>
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/dashboard" element={<p>Home page</p>} />
      <Route path="/billing" element={<p>Billing page</p>} />
    </Routes>,
    { route, authValue },
  );
  return authValue;
}

describe('VerifyEmail page', () => {
  beforeEach(() => {
    verifyEmail.mockReset();
  });

  it('signs the new user in and goes straight to the Home page', async () => {
    verifyEmail.mockResolvedValue(account);
    const auth = renderLink('/verify-email?token=abc');

    expect(await screen.findByText('Home page')).toBeInTheDocument();
    expect(verifyEmail).toHaveBeenCalledTimes(1);
    expect(verifyEmail).toHaveBeenCalledWith('abc');
    expect(auth.signInAs).toHaveBeenCalledWith(account);
    // Uses the account the link returned instead of asking the server again.
    expect(auth.refreshUser).not.toHaveBeenCalled();
  });

  it('goes on to paying when a plan was chosen before signing up', async () => {
    verifyEmail.mockResolvedValue(account);
    renderLink('/verify-email?token=abc&plan=pro');

    expect(await screen.findByText('Billing page')).toBeInTheDocument();
  });

  it('goes to the Home page when the link is no longer accepted but the user is signed in', async () => {
    verifyEmail.mockRejectedValue(new Error('This verification link is invalid or has expired'));
    renderLink('/verify-email?token=old', { refreshUser: vi.fn().mockResolvedValue(account) });

    expect(await screen.findByText('Home page')).toBeInTheDocument();
  });

  it('explains an expired link to someone who is not signed in', async () => {
    verifyEmail.mockRejectedValue(new Error('This verification link is invalid or has expired'));
    renderLink('/verify-email?token=old');

    expect(await screen.findByText(/This link has expired/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument();
  });

  it('shows the expired message straight away when the link has no token', () => {
    renderLink('/verify-email');

    expect(screen.getByText(/This link has expired/)).toBeInTheDocument();
    expect(verifyEmail).not.toHaveBeenCalled();
  });
});
