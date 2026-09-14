import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetchOnce } from '../../testUtils/mockFetch.js';
import QuickAddTransactionForm from './QuickAddTransactionForm.jsx';

describe('QuickAddTransactionForm', () => {
  it('submits with the correct POST body and dispatches transaction:created', async () => {
    const created = { id: 1, description: 'Coffee', amount: 5, type: 'expense', category: 'Food' };
    const fetchMock = mockFetchOnce(created, { status: 201 });
    const spy = vi.fn();
    window.addEventListener('transaction:created', spy);

    render(<QuickAddTransactionForm categories={['Food', 'Rent']} onSuccess={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText(/description/i), 'Coffee');
    await userEvent.type(screen.getByPlaceholderText(/amount/i), '5');
    await userEvent.click(screen.getByRole('button', { name: /add transaction/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toMatchObject({ description: 'Coffee', amount: 5, type: 'expense', category: 'Food' });

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    window.removeEventListener('transaction:created', spy);
  });

  it('surfaces a server error without dispatching transaction:created', async () => {
    mockFetchOnce({ error: 'amount must be a positive number' }, { status: 400 });
    const spy = vi.fn();
    window.addEventListener('transaction:created', spy);

    render(<QuickAddTransactionForm categories={['Food']} onSuccess={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText(/description/i), 'Bad');
    await userEvent.type(screen.getByPlaceholderText(/amount/i), '0');
    await userEvent.click(screen.getByRole('button', { name: /add transaction/i }));

    expect(await screen.findByText(/failed to create transaction/i)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
    window.removeEventListener('transaction:created', spy);
  });
});
