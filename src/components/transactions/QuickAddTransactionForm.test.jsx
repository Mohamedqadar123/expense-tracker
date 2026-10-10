import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetchOnce } from '../../testUtils/mockFetch.js';
import QuickAddTransactionForm from './QuickAddTransactionForm.jsx';

// The component also fires a GET /accounts on mount (to offer a Bank/EVC-style
// account picker when the user has set any up), so tests look up the POST
// call by its method rather than assuming it's fetch's first call.
function findPostCall(fetchMock) {
  return fetchMock.mock.calls.find(([, options]) => options?.method === 'POST');
}

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

    await waitFor(() => expect(findPostCall(fetchMock)).toBeTruthy());
    const [, options] = findPostCall(fetchMock);
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

    expect(findPostCall(fetchMock)).toBeUndefined();
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
    mockFetchOnce([]);
    render(<QuickAddTransactionForm categories={['Food', 'Salary']} onSuccess={vi.fn()} />);

    // The category picker comes first; the account picker (always present,
    // since it offers the preset banks) is the second combobox.
    const select = screen.getAllByRole('combobox')[0];
    expect(select).toHaveValue('Food');

    await userEvent.click(screen.getByRole('button', { name: /credit/i }));

    expect(select).toHaveValue('Salary');
    expect(within(select).getAllByRole('option')).toHaveLength(1);
    expect(within(select).getByRole('option', { name: 'Salary' })).toBeInTheDocument();
  });

  it('offers a dropdown of the user\'s real accounts instead of free text once any exist', async () => {
    mockFetchOnce([
      { id: 1, name: 'Bank', startingBalance: 100, income: 0, expense: 0, balance: 100 },
      { id: 2, name: 'EVC', startingBalance: 20, income: 0, expense: 0, balance: 20 },
    ]);

    render(<QuickAddTransactionForm categories={['Food']} onSuccess={vi.fn()} />);

    await waitFor(() => expect(screen.getByRole('option', { name: 'Bank' })).toBeInTheDocument());
    expect(screen.getByRole('option', { name: 'EVC' })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/account \(optional\)/i)).not.toBeInTheDocument();
  });

  it('offers the preset banks and EVC Plus alongside the accounts the user already has', async () => {
    mockFetchOnce([{ id: 1, name: 'salam bank', startingBalance: 0, income: 0, expense: 0, balance: 0 }]);

    render(<QuickAddTransactionForm categories={['Food']} onSuccess={vi.fn()} />);

    await waitFor(() => expect(screen.getByRole('option', { name: 'salam bank' })).toBeInTheDocument());
    for (const name of ['Premier Bank', 'IBS Bank', 'Bulsho Bank', 'My Bank', 'Dahabshil Bank', 'EVC Plus']) {
      expect(screen.getByRole('option', { name })).toBeInTheDocument();
    }
    // Already one of the user's accounts, so it isn't offered a second time.
    expect(screen.queryByRole('option', { name: 'Salam Bank' })).not.toBeInTheDocument();
  });
});
