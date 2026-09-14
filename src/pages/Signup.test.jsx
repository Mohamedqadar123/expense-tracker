import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils/renderWithProviders.jsx';
import Signup from './Signup.jsx';

describe('Signup page', () => {
  it('signs up and navigates to /dashboard on success', async () => {
    const signup = vi.fn().mockResolvedValue({ id: 1, email: 'new@test.com' });
    renderWithProviders(<Signup />, { authValue: { signup } });

    await userEvent.type(screen.getByPlaceholderText('Email'), 'new@test.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(signup).toHaveBeenCalledWith('new@test.com', 'password123', '');
  });

  it('surfaces a server error (e.g. duplicate email) without navigating', async () => {
    const signup = vi.fn().mockRejectedValue(new Error('An account with this email already exists'));
    renderWithProviders(<Signup />, { authValue: { signup } });

    await userEvent.type(screen.getByPlaceholderText('Email'), 'existing@test.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText('An account with this email already exists')).toBeInTheDocument();
  });
});
