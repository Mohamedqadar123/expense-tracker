import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils/renderWithProviders.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import Dashboard from './Dashboard.jsx';

// June 15, 2024, so "This Month" is June 1-15 and the 15 days before it are May 17-31.
const TODAY = new Date(2024, 5, 15, 12, 0, 0);

function overviewWith(summary, extra = {}) {
  return {
    summary: { totalBalance: 0, income: 0, expenses: 0, savings: 0, savingsRate: null, ...summary },
    monthlySpendingTrend: [],
    incomeVsExpenses: [],
    recentTransactions: [],
    spendingByCategory: [],
    insights: [],
    budgetProgress: [],
    ...extra,
  };
}

const groceries = {
  id: 7, description: 'Groceries', category: 'food', account: 'Bank', amount: 250, type: 'expense',
  date: '2024-06-05T00:00:00.000Z',
};

const juneWithData = overviewWith(
  { totalBalance: 750, income: 1000, expenses: 250, savings: 750, savingsRate: 75 },
  {
    recentTransactions: [groceries],
    incomeVsExpenses: [{ bucket: '2024-06-05', income: 1000, expenses: 250 }],
    spendingByCategory: [{ category: 'food', amount: 250 }],
  },
);

const accounts = [
  { id: 1, name: 'Bank', startingBalance: 500, balance: 1000 },
  { id: 2, name: 'EVC', startingBalance: 0, balance: 250 },
];

// Answers by URL rather than by call order, so a test can ask for any period.
function mockApi({ periods = {}, accountList = accounts } = {}) {
  const fetchMock = vi.fn(async (url) => {
    const body = url.includes('/accounts')
      ? accountList
      : periods[new URL(url, 'http://test').searchParams.get('start')] ?? overviewWith({});
    return { ok: true, status: 200, json: async () => body };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function card(title) {
  return screen.getByText(title).closest('.stat-card');
}

const auth = { user: { email: 'moha@test.com' }, isLoading: false, login: vi.fn(), signup: vi.fn(), logout: vi.fn() };

// The charts read their colours from the theme.
function renderDashboard() {
  return renderWithProviders(<ThemeProvider><Dashboard /></ThemeProvider>, { authValue: auth });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Dashboard', () => {
  it('shows an empty state with an add action when the period has no transactions', async () => {
    mockApi({ accountList: [] });
    renderDashboard();

    expect(await screen.findByText('No transactions in this period')).toBeInTheDocument();
    expect(within(card('Total Income')).getByText('$0.00')).toBeInTheDocument();
    // No income to take a share of: a placeholder, never NaN or 0%
    expect(within(card('Savings Rate')).getByText('N/A')).toBeInTheDocument();
    expect(within(card('Savings Rate')).getByText('No income in this period')).toBeInTheDocument();
    expect(screen.queryByText('Income vs Expenses')).not.toBeInTheDocument();
    expect(screen.queryByText('Recent Transactions')).not.toBeInTheDocument();

    const opened = vi.fn();
    window.addEventListener('quick-add:open', opened);
    await userEvent.click(within(screen.getByText('No transactions in this period').closest('.empty-state'))
      .getByRole('button', { name: 'Add Transaction' }));
    window.removeEventListener('quick-add:open', opened);
    expect(opened).toHaveBeenCalledTimes(1);
  });

  it('shows the figures the API returns for the selected period', async () => {
    mockApi({ periods: { '2024-06-01': juneWithData } });
    renderDashboard();

    expect(await screen.findByText('Welcome back, moha')).toBeInTheDocument();
    expect(within(card('Total Income')).getByText('$1,000.00')).toBeInTheDocument();
    expect(within(card('Total Expenses')).getByText('$250.00')).toBeInTheDocument();
    expect(within(card('Savings Rate')).getByText('75%')).toBeInTheDocument();

    const row = screen.getByText('Groceries').closest('tr');
    expect(within(row).getByText('Jun 5, 2024')).toBeInTheDocument();
    expect(within(row).getByText('food')).toBeInTheDocument();
    expect(within(row).getByText('Bank')).toBeInTheDocument();
    expect(within(row).getByText('Expense')).toBeInTheDocument();
    expect(within(row).getByText('-$250.00')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'View all transactions' }))
      .toHaveAttribute('href', '/transactions?startDate=2024-06-01&endDate=2024-06-15');
  });

  it('shows the same totals on the charts as on the cards', async () => {
    mockApi({ periods: { '2024-06-01': juneWithData } });
    renderDashboard();
    await screen.findByText('Groceries');

    const comparison = screen.getByText('Income vs Expenses').closest('.chart-card');
    expect(within(comparison).getByText('$1,000.00')).toBeInTheDocument();
    expect(within(comparison).getByText('$250.00')).toBeInTheDocument();
    expect(within(card('Total Income')).getByText('$1,000.00')).toBeInTheDocument();

    const byCategory = screen.getByText('Spending by Category').closest('.chart-card');
    expect(within(byCategory).getByText('Total spent').parentElement).toHaveTextContent('$250.00');
    expect(within(card('Total Expenses')).getByText('$250.00')).toBeInTheDocument();
  });

  it('takes the total balance from the accounts, not from the period income', async () => {
    mockApi({ periods: { '2024-06-01': juneWithData } });
    renderDashboard();

    // Bank 1,000 + EVC 250: includes the 500 starting balance the overview's own figure (750) leaves out
    expect(await screen.findByText('$1,250.00')).toBeInTheDocument();
    expect(within(card('Total Balance')).getByText('$1,250.00')).toBeInTheDocument();
  });

  it('compares with the period just before only when that period has figures', async () => {
    const mayWithData = overviewWith({ income: 800, expenses: 500, savings: 300, savingsRate: 37.5 });
    mockApi({ periods: { '2024-06-01': juneWithData, '2024-05-17': mayWithData } });
    const { unmount } = renderDashboard();

    await screen.findByText('Groceries');
    expect(within(card('Total Income')).getByText('+25% vs previous period')).toHaveClass('stat-trend-positive');
    expect(within(card('Total Expenses')).getByText('-50% vs previous period')).toHaveClass('stat-trend-positive');
    expect(within(card('Savings Rate')).getByText('+38 pts vs previous period')).toBeInTheDocument();
    expect(within(card('Total Balance')).queryByText(/vs previous/)).not.toBeInTheDocument();
    unmount();

    mockApi({ periods: { '2024-06-01': juneWithData } });
    renderDashboard();
    await screen.findByText('Groceries');
    expect(screen.queryByText(/vs previous/)).not.toBeInTheDocument();
  });

  it('says the server cannot be reached, offers Retry, and recovers', async () => {
    let online = false;
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (!online) throw new TypeError('Failed to fetch');
      return { ok: true, status: 200, json: async () => (url.includes('/accounts') ? accounts : juneWithData) };
    }));
    renderDashboard();

    expect(await screen.findByText("Can't reach the server. Check your internet connection and try again.")).toBeInTheDocument();
    // No figures are invented while there is nothing to show
    expect(screen.queryByText('Total Income')).not.toBeInTheDocument();

    online = true;
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Groceries')).toBeInTheDocument();
    expect(screen.queryByText(/can't reach the server/i)).not.toBeInTheDocument();
  });

  it('clears an earlier failure when a later reload works', async () => {
    let online = false;
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (!online) throw new TypeError('Failed to fetch');
      return { ok: true, status: 200, json: async () => (url.includes('/accounts') ? accounts : juneWithData) };
    }));
    renderDashboard();
    await screen.findByText(/can't reach the server/i);

    // A transaction saved elsewhere makes the dashboard load again
    online = true;
    window.dispatchEvent(new CustomEvent('transaction:created'));

    expect(await screen.findByText('Groceries')).toBeInTheDocument();
    expect(screen.queryByText(/can't reach the server/i)).not.toBeInTheDocument();
  });

  it('asks for the new range and shows its figures when the period changes', async () => {
    const today = overviewWith({ income: 40, expenses: 10, savings: 30, savingsRate: 75 });
    const fetchMock = mockApi({ periods: { '2024-06-01': juneWithData, '2024-06-15': today } });
    renderDashboard();
    await screen.findByText('Groceries');

    await userEvent.click(screen.getByRole('button', { name: 'Today' }));

    await waitFor(() => expect(within(card('Total Income')).getByText('$40.00')).toBeInTheDocument());
    expect(within(card('Total Expenses')).getByText('$10.00')).toBeInTheDocument();
    const requested = fetchMock.mock.calls.map(([url]) => url).filter((url) => url.includes('/dashboard/overview'));
    expect(requested).toContain('/api/dashboard/overview?start=2024-06-15&end=2024-06-15');
    // ...and the day before it, for the comparison
    expect(requested).toContain('/api/dashboard/overview?start=2024-06-14&end=2024-06-14');
  });
});
