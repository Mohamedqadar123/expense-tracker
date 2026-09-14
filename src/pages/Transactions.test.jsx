import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils/renderWithProviders.jsx';
import { mockFetchSequence } from '../testUtils/mockFetch.js';
import Transactions from './Transactions.jsx';

function listPage(data, overrides = {}) {
  return { data, total: data.length, page: 1, totalPages: 1, ...overrides };
}

describe('Transactions page', () => {
  it('renders a list of transactions from the API', async () => {
    mockFetchSequence([
      { body: [] }, // accounts
      { body: listPage([{ id: 1, description: 'Groceries', category: 'Food', account: 'Checking', amount: 50, type: 'expense', date: '2024-01-05T00:00:00.000Z' }]) },
    ]);

    renderWithProviders(<Transactions />);

    expect(await screen.findByText('Groceries')).toBeInTheDocument();
  });

  it('shows an empty state when there are no matching transactions', async () => {
    mockFetchSequence([{ body: [] }, { body: listPage([]) }]);
    renderWithProviders(<Transactions />);

    expect(await screen.findByText(/no.*match/i)).toBeInTheDocument();
  });

  it('refetches with a delete request when the delete button is clicked', async () => {
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(true);

    const fetchMock = mockFetchSequence([
      { body: [] },
      { body: listPage([{ id: 1, description: 'Groceries', category: 'Food', account: 'Checking', amount: 50, type: 'expense', date: '2024-01-05T00:00:00.000Z' }]) },
      { body: null, status: 204 },
      { body: listPage([]) },
    ]);

    renderWithProviders(<Transactions />);
    await screen.findByText('Groceries');

    await userEvent.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      const deleteCall = fetchMock.mock.calls.find(([, opts]) => opts?.method === 'DELETE');
      expect(deleteCall).toBeDefined();
    });

    window.confirm = originalConfirm;
  });
});
