import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils/renderWithProviders.jsx';
import Signup from './Signup.jsx';

describe('Signup page', () => {
  it('asks the visitor to confirm their email instead of signing them in', async () => {
    const signup = vi.fn().mockResolvedValue({ message: 'Check your email', email: 'new@test.com' });
    renderWithProviders(<Signup />, { authValue: { signup } });

    await userEvent.type(screen.getByPlaceholderText('Email'), 'new@test.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(signup).toHaveBeenCalledWith('new@test.com', 'password123', '', undefined);
    expect(await screen.findByText('Check Your Email')).toBeInTheDocument();
    expect(screen.getByText('new@test.com')).toBeInTheDocument();
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
