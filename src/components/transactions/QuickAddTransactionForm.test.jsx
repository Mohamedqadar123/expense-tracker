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

  it('blocks submission client-side for a non-positive amount, without calling the API', async () => {
    const fetchMock = mockFetchOnce({ id: 1 }, { status: 201 });
    const spy = vi.fn();
    window.addEventListener('transaction:created', spy);

    render(<QuickAddTransactionForm categories={['Food']} onSuccess={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText(/description/i), 'Bad');
    await userEvent.type(screen.getByPlaceholderText(/amount/i), '0');
    await userEvent.click(screen.getByRole('button', { name: /add transaction/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalled();
    window.removeEventListener('transaction:created', spy);
  });

  it("surfaces the backend's specific error message without dispatching transaction:created", async () => {
    mockFetchOnce({ error: 'Too many requests, please slow down' }, { status: 429 });
    const spy = vi.fn();
    window.addEventListener('transaction:created', spy);

    render(<QuickAddTransactionForm categories={['Food']} onSuccess={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText(/description/i), 'Coffee');
    await userEvent.type(screen.getByPlaceholderText(/amount/i), '5');
    await userEvent.click(screen.getByRole('button', { name: /add transaction/i }));

    expect(await screen.findByText(/too many requests, please slow down/i)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
    window.removeEventListener('transaction:created', spy);
  });

  it('filters the category dropdown to income categories when Credit is selected', async () => {
    render(<QuickAddTransactionForm categories={['Food', 'Salary']} onSuccess={vi.fn()} />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('Food');

    await userEvent.click(screen.getByRole('button', { name: /credit/i }));

    expect(select).toHaveValue('Salary');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'Salary' })).toBeInTheDocument();
  });
});
