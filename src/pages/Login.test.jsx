import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils/renderWithProviders.jsx';
import Login from './Login.jsx';

describe('Login page', () => {
  it('logs in and navigates to /dashboard on success', async () => {
    const login = vi.fn().mockResolvedValue({ id: 1, email: 'a@test.com' });
    renderWithProviders(<Login />, { authValue: { login } });

    await userEvent.type(screen.getByPlaceholderText('Email'), 'a@test.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('a@test.com', 'password123'));
  });

  it('shows an error message and does not navigate on failure', async () => {
    const login = vi.fn().mockRejectedValue(new Error('Invalid email or password'));
    renderWithProviders(<Login />, { authValue: { login } });

    await userEvent.type(screen.getByPlaceholderText('Email'), 'a@test.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });
});
