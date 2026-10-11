import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils/renderWithProviders.jsx';
import Transactions from './Transactions.jsx';

function listPage(data, overrides = {}) {
  return { data, total: data.length, page: 1, totalPages: 1, ...overrides };
}

const groceries = {
  id: 1, description: 'Groceries', category: 'food', account: 'Checking', amount: 50, type: 'expense',
  date: '2024-01-05T00:00:00.000Z',
};
const salary = {
  id: 2, description: 'January pay', category: 'salary', account: 'Checking', amount: 1200, type: 'income',
  date: '2024-01-01T00:00:00.000Z',
};

// Answers by URL and method rather than by call order. `lists` are the pages
// the list endpoint returns, in order; the last one repeats.
function mockApi({ lists = [listPage([])], onWrite } = {}) {
  let listCalls = 0;
  const fetchMock = vi.fn(async (url, options = {}) => {
    const method = options.method || 'GET';
    let body;
    let status = 200;
    if (method !== 'GET') {
      ({ body = null, status = method === 'DELETE' ? 204 : 200 } = onWrite?.(url, options) || {});
    } else if (url.includes('/transactions/accounts')) {
      body = ['Checking'];
    } else if (url.includes('/accounts')) {
      body = [{ id: 1, name: 'Checking', startingBalance: 0, balance: 1150 }];
    } else {
      body = lists[Math.min(listCalls, lists.length - 1)];
      listCalls += 1;
    }
    return { ok: status < 400, status, json: async () => body };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function listRequests(fetchMock) {
  return fetchMock.mock.calls
    .filter(([url, options]) => !options?.method && url.includes('/transactions?'))
    .map(([url]) => new URL(url, 'http://test').searchParams);
}

describe('Transactions page', () => {
  it('lists each transaction with its date, category, account, type and signed amount', async () => {
    mockApi({ lists: [listPage([groceries, salary])] });
    renderWithProviders(<Transactions />);

    const expenseRow = (await screen.findByText('Groceries')).closest('tr');
    expect(within(expenseRow).getByText('Jan 5, 2024')).toBeInTheDocument();
    expect(within(expenseRow).getByText('food')).toBeInTheDocument();
    expect(within(expenseRow).getByText('Checking')).toBeInTheDocument();
    expect(within(expenseRow).getByText('Expense')).toBeInTheDocument();
    expect(within(expenseRow).getByText('-$50.00')).toHaveClass('expense-amount');

    // An income is a credit: shown with a plus, never as a negative expense
    const incomeRow = screen.getByText('January pay').closest('tr');
    expect(within(incomeRow).getByText('Income')).toBeInTheDocument();
    expect(within(incomeRow).getByText('+$1,200.00')).toHaveClass('income-amount');
  });

  it('invites a first transaction when there are none at all', async () => {
    mockApi();
    renderWithProviders(<Transactions />);

    expect(await screen.findByText('No transactions yet')).toBeInTheDocument();

    const opened = vi.fn();
    window.addEventListener('quick-add:open', opened);
    await userEvent.click(within(screen.getByText('No transactions yet').closest('.empty-state'))
      .getByRole('button', { name: 'Add Transaction' }));
    window.removeEventListener('quick-add:open', opened);
    expect(opened).toHaveBeenCalledTimes(1);
  });

  it('says nothing matches, rather than that nothing exists, when filters hide everything', async () => {
    mockApi();
    renderWithProviders(<Transactions />, { route: '/transactions?type=income&search=rent' });

    expect(await screen.findByText(/no.*match/i)).toBeInTheDocument();
    expect(screen.queryByText('No transactions yet')).not.toBeInTheDocument();
  });

  it('offers to clear the filters when they hide everything', async () => {
    const fetchMock = mockApi({ lists: [listPage([]), listPage([groceries])] });
    renderWithProviders(<Transactions />, { route: '/transactions?search=rent' });
    const empty = (await screen.findByText(/no.*match/i)).closest('.empty-state');

    await userEvent.click(within(empty).getByRole('button', { name: 'Clear filters' }));

    expect(await screen.findByText('Groceries')).toBeInTheDocument();
    expect(listRequests(fetchMock).at(-1).get('search')).toBeNull();
  });

  it('says the server cannot be reached, not that there are no transactions, and loads on Retry', async () => {
    let online = false;
    const fetchMock = vi.fn(async (url) => {
      if (!online) throw new TypeError('Failed to fetch');
      const body = url.includes('/transactions/accounts') ? [] : listPage([groceries]);
      return { ok: true, status: 200, json: async () => body };
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderWithProviders(<Transactions />);

    expect(await screen.findByText("Can't reach the server. Check your internet connection and try again.")).toBeInTheDocument();
    // Neither the browser's own wording nor a false "nothing here"
    expect(screen.queryByText(/failed to fetch/i)).not.toBeInTheDocument();
    expect(screen.queryByText('No transactions yet')).not.toBeInTheDocument();

    online = true;
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Groceries')).toBeInTheDocument();
    expect(screen.queryByText(/can't reach the server/i)).not.toBeInTheDocument();
  });

  it('does not say Deleted, and keeps the row, when the server fails to delete', async () => {
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(true);
    mockApi({ lists: [listPage([groceries])], onWrite: () => ({ status: 500, body: { error: 'Something went wrong' } }) });
    renderWithProviders(<Transactions />);
    await screen.findByText('Groceries');

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Something went wrong on our side. Please try again in a moment.')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.queryByText('Deleted')).not.toBeInTheDocument();
    window.confirm = originalConfirm;
  });

  it('sends the search, date range and type filters to the API', async () => {
    const fetchMock = mockApi({ lists: [listPage([groceries])] });
    renderWithProviders(<Transactions />, {
      route: '/transactions?search=groc&startDate=2024-01-01&endDate=2024-01-31&type=expense',
    });
    await screen.findByText('Groceries');

    const [params] = listRequests(fetchMock);
    expect(params.get('search')).toBe('groc');
    expect(params.get('startDate')).toBe('2024-01-01');
    expect(params.get('endDate')).toBe('2024-01-31');
    expect(params.get('type')).toBe('expense');
  });

  it('asks again with the new type when the type filter changes', async () => {
    const fetchMock = mockApi({ lists: [listPage([groceries, salary]), listPage([salary])] });
    renderWithProviders(<Transactions />);
    await screen.findByText('Groceries');

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'income');

    await waitFor(() => expect(screen.queryByText('Groceries')).not.toBeInTheDocument());
    expect(listRequests(fetchMock).at(-1).get('type')).toBe('income');
  });

  it('opens the page\'s Add Transaction button onto the shared add form', async () => {
    mockApi({ lists: [listPage([groceries])] });
    renderWithProviders(<Transactions />);
    await screen.findByText('Groceries');

    const opened = vi.fn();
    window.addEventListener('quick-add:open', opened);
    await userEvent.click(screen.getByRole('button', { name: 'Add Transaction' }));
    window.removeEventListener('quick-add:open', opened);
    expect(opened).toHaveBeenCalledTimes(1);
  });

  it('edits a transaction in a dialog and reloads the list', async () => {
    const edited = { ...groceries, description: 'Groceries and fruit', amount: 65 };
    const fetchMock = mockApi({
      lists: [listPage([groceries]), listPage([edited])],
      onWrite: () => ({ body: edited }),
    });
    renderWithProviders(<Transactions />);
    await screen.findByText('Groceries');

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit Transaction' });
    const amount = within(dialog).getByLabelText('Amount');
    expect(amount).toHaveValue(50);
    // Opens as the type it already is: editing must not flip an expense to income
    expect(within(dialog).getByRole('button', { name: 'Expense' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.clear(amount);
    await userEvent.type(amount, '65');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('-$65.00')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const [url, options] = fetchMock.mock.calls.find(([, opts]) => opts?.method === 'PUT');
    expect(url).toBe('/api/transactions/1');
    expect(JSON.parse(options.body)).toMatchObject({ description: 'Groceries', amount: 65, type: 'expense', account: 'Checking', date: '2024-01-05' });
  });

  it('keeps the edit dialog open with the reason when the server refuses the change', async () => {
    mockApi({
      lists: [listPage([groceries])],
      onWrite: () => ({ status: 400, body: { error: '"Checking" only has $20.00 available.' } }),
    });
    renderWithProviders(<Transactions />);
    await screen.findByText('Groceries');

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit Transaction' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await within(dialog).findByText('"Checking" only has $20.00 available.')).toBeInTheDocument();
  });

  it('deletes only after confirmation, then reloads the list', async () => {
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(false);
    const fetchMock = mockApi({ lists: [listPage([groceries]), listPage([])] });
    renderWithProviders(<Transactions />);
    await screen.findByText('Groceries');

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.some(([, opts]) => opts?.method === 'DELETE')).toBe(false);
    expect(screen.getByText('Groceries')).toBeInTheDocument();

    window.confirm.mockReturnValue(true);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(screen.queryByText('Groceries')).not.toBeInTheDocument());
    const [url] = fetchMock.mock.calls.find(([, opts]) => opts?.method === 'DELETE');
    expect(url).toBe('/api/transactions/1');
    window.confirm = originalConfirm;
  });
});
