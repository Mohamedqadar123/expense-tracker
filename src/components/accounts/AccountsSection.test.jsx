import { describe, it, expect, vi } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../testUtils/renderWithProviders.jsx';
import AccountsSection from './AccountsSection.jsx';

const bank = { id: 1, name: 'Salam Bank', startingBalance: 100, income: 2000, expense: 350, balance: 1750 };
const evc = { id: 2, name: 'EVC Plus', startingBalance: 0, income: 40, expense: 0, balance: 40 };

const rent = {
  id: 11, description: 'Rent', category: 'other', account: 'Salam Bank', amount: 200, type: 'expense',
  date: '2024-06-01T00:00:00.000Z',
};

// Answers by URL and method. `accountLists` are what GET /accounts returns,
// in order; the last one repeats. `activity` maps an account name to its
// latest transactions.
function mockApi({ accountLists = [[bank, evc]], activity = {}, onWrite } = {}) {
  let accountCalls = 0;
  const fetchMock = vi.fn(async (url, options = {}) => {
    const method = options.method || 'GET';
    let body;
    let status = 200;
    if (method !== 'GET') {
      ({ body = null, status = method === 'DELETE' ? 204 : 200 } = onWrite?.(url, options) || {});
    } else if (url.includes('/transactions')) {
      const account = new URL(url, 'http://test').searchParams.get('account');
      const data = activity[account] || [];
      body = { data, total: data.length, page: 1, totalPages: 1 };
    } else {
      body = accountLists[Math.min(accountCalls, accountLists.length - 1)];
      accountCalls += 1;
    }
    return { ok: status < 400, status, json: async () => body };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function cardFor(name) {
  return screen.getByRole('heading', { name }).closest('.account-card');
}

describe('AccountsSection', () => {
  it('shows each account as a card with its type, currency and the balance the API worked out', async () => {
    mockApi();
    renderWithProviders(<AccountsSection />);

    const bankCard = (await screen.findByRole('heading', { name: 'Salam Bank' })).closest('.account-card');
    expect(within(bankCard).getByText('Bank account')).toBeInTheDocument();
    expect(within(bankCard).getByText('USD')).toBeInTheDocument();
    expect(within(bankCard).getByText('$1,750.00')).toHaveClass('account-balance');
    // What the balance is made of: 100 to start, 2,000 in, 350 out
    expect(within(bankCard).getByText('Starting balance: $100.00')).toBeInTheDocument();
    expect(within(bankCard).getByText('In $2,000.00')).toBeInTheDocument();
    expect(within(bankCard).getByText('Out $350.00')).toBeInTheDocument();

    expect(within(cardFor('EVC Plus')).getByText('Mobile money')).toBeInTheDocument();
  });

  it('adds the balances up into one total', async () => {
    mockApi();
    renderWithProviders(<AccountsSection />);

    const total = (await screen.findByText('Total balance, all accounts')).closest('.accounts-total');
    expect(within(total).getByText('$1,790.00')).toBeInTheDocument();
  });

  it('shows an account in the red as negative, not as a positive balance', async () => {
    mockApi({ accountLists: [[{ ...evc, income: 0, expense: 25, balance: -25 }]] });
    renderWithProviders(<AccountsSection />);

    const card = (await screen.findByRole('heading', { name: 'EVC Plus' })).closest('.account-card');
    expect(within(card).getByText('-$25.00')).toHaveClass('expense-amount');
  });

  it('lists each account\'s own recent activity and links to its transactions', async () => {
    const fetchMock = mockApi({ activity: { 'Salam Bank': [rent] } });
    renderWithProviders(<AccountsSection />);

    const bankCard = (await screen.findByText('Rent')).closest('.account-card');
    expect(within(bankCard).getByRole('heading', { name: 'Salam Bank' })).toBeInTheDocument();
    expect(within(bankCard).getByText('Jun 1, 2024')).toBeInTheDocument();
    expect(within(bankCard).getByText('-$200.00')).toBeInTheDocument();
    expect(within(cardFor('EVC Plus')).getByText('No activity yet')).toBeInTheDocument();

    expect(within(bankCard).getByRole('link', { name: 'View transactions' }))
      .toHaveAttribute('href', '/transactions?account=Salam%20Bank');
    // Asked for by account, a few at a time
    const asked = fetchMock.mock.calls.map(([url]) => url).filter((url) => url.includes('/transactions'));
    expect(asked).toContain('/api/transactions?account=Salam+Bank&limit=3');
  });

  it('creates an account from the dialog and shows it', async () => {
    const cash = { id: 3, name: 'Cash', startingBalance: 60, income: 0, expense: 0, balance: 60 };
    const fetchMock = mockApi({
      accountLists: [[bank], [bank, cash]],
      onWrite: () => ({ status: 201, body: cash }),
    });
    renderWithProviders(<AccountsSection />);
    await screen.findByRole('heading', { name: 'Salam Bank' });

    await userEvent.click(screen.getByRole('button', { name: 'Add Account' }));
    const dialog = screen.getByRole('dialog', { name: 'Add Account' });
    await userEvent.type(within(dialog).getByLabelText('Account name'), 'Cash');
    await userEvent.type(within(dialog).getByLabelText('Starting balance'), '60');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }));

    const card = (await screen.findByRole('heading', { name: 'Cash' })).closest('.account-card');
    expect(within(card).getByText('$60.00')).toBeInTheDocument();
    expect(within(card).getByText('Cash', { selector: '.account-type' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const [, options] = fetchMock.mock.calls.find(([, opts]) => opts?.method === 'POST');
    expect(JSON.parse(options.body)).toEqual({ name: 'Cash', startingBalance: 60 });
  });

  it('edits an account from the dialog and shows the balance the API returns', async () => {
    const raised = { ...bank, startingBalance: 300, balance: 1950 };
    const fetchMock = mockApi({ accountLists: [[bank], [raised]], onWrite: () => ({ body: raised }) });
    renderWithProviders(<AccountsSection />);
    await screen.findByRole('heading', { name: 'Salam Bank' });

    await userEvent.click(within(cardFor('Salam Bank')).getByRole('button', { name: 'Edit' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit Account' });
    const starting = within(dialog).getByLabelText('Starting balance');
    expect(starting).toHaveValue(100);
    await userEvent.clear(starting);
    await userEvent.type(starting, '300');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    // With a single account the total shows the same figure, so look on the card
    await waitFor(() => expect(within(cardFor('Salam Bank')).getByText('$1,950.00')).toBeInTheDocument());
    const [url, options] = fetchMock.mock.calls.find(([, opts]) => opts?.method === 'PUT');
    expect(url).toBe('/api/accounts/1');
    expect(JSON.parse(options.body)).toEqual({ name: 'Salam Bank', startingBalance: 300 });
  });

  it('keeps the cards and says why when the server refuses to delete an account', async () => {
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(true);
    mockApi({
      onWrite: () => ({ status: 409, body: { error: '"Salam Bank" has transactions, so it can\'t be deleted.' } }),
    });
    renderWithProviders(<AccountsSection />);
    await screen.findByRole('heading', { name: 'Salam Bank' });

    await userEvent.click(within(cardFor('Salam Bank')).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('"Salam Bank" has transactions, so it can\'t be deleted.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Salam Bank' })).toBeInTheDocument();
    window.confirm = originalConfirm;
  });

  it('opens the transaction form preset to the account and direction, and reloads once it saves', async () => {
    const credited = { ...evc, income: 65, balance: 65 };
    const fetchMock = mockApi({ accountLists: [[bank, evc], [bank, evc], [bank, credited]], onWrite: () => ({ status: 201, body: { id: 99 } }) });
    renderWithProviders(<AccountsSection />);
    await screen.findByRole('heading', { name: 'EVC Plus' });

    await userEvent.click(within(cardFor('EVC Plus')).getByRole('button', { name: 'Credit' }));
    const dialog = screen.getByRole('dialog', { name: 'Credit: EVC Plus' });
    // Credit means money in: the form opens as Income on this account
    expect(within(dialog).getByRole('button', { name: 'Income' })).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(within(dialog).getByRole('combobox', { name: 'Account' })).toHaveValue('EVC Plus'));

    await userEvent.type(within(dialog).getByLabelText('Description'), 'Top up');
    await userEvent.type(within(dialog).getByLabelText('Amount'), '25');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add Transaction' }));

    expect(await within(cardFor('EVC Plus')).findByText('$65.00')).toBeInTheDocument();
    const [, options] = fetchMock.mock.calls.find(([, opts]) => opts?.method === 'POST');
    expect(JSON.parse(options.body)).toMatchObject({ description: 'Top up', amount: 25, type: 'income', account: 'EVC Plus' });
  });
});
