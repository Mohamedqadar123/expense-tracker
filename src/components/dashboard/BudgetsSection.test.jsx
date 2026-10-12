import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../testUtils/renderWithProviders.jsx';
import BudgetsSection from './BudgetsSection.jsx';

const groceries = {
  id: 1,
  name: 'Groceries budget',
  category: 'Food',
  period: 'monthly',
  amount: 200,
  spent: 150,
  remaining: 50,
  percentUsed: 75,
  status: 'warning',
  startDate: '2024-06-01T00:00:00.000Z',
  endDate: '2024-06-30T00:00:00.000Z',
};

const outings = {
  id: 2,
  name: 'Outings',
  category: 'Entertainment',
  period: 'weekly',
  amount: 100,
  spent: 180,
  remaining: -80,
  percentUsed: 180,
  status: 'exceeded',
  startDate: '2024-06-10T00:00:00.000Z',
  endDate: '2024-06-16T00:00:00.000Z',
};

// Answers by method: `lists` are what GET returns, in order (the last repeats).
function mockApi({ lists, onWrite } = {}) {
  let reads = 0;
  const fetchMock = vi.fn(async (url, options = {}) => {
    const method = options.method || 'GET';
    let body;
    let status = 200;
    if (method === 'GET') {
      body = lists[Math.min(reads, lists.length - 1)];
      reads += 1;
    } else {
      ({ body = null, status = method === 'DELETE' ? 204 : 200 } = onWrite?.(url, options) || {});
    }
    return { ok: status < 400, status, json: async () => body };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function cardFor(name) {
  return screen.getByRole('heading', { name }).closest('.budget-card');
}

function figure(scope, label) {
  return within(scope).getByText(label).closest('div');
}

function overview(title) {
  return screen.getByText(title).closest('.stat-card');
}

// June 15, 2024: inside both budgets' dates, so neither is ended or upcoming.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2024, 5, 15, 12, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('BudgetsSection', () => {
  it('shows budgeted, spent and remaining as three separate labelled figures', async () => {
    mockApi({ lists: [[groceries]] });
    renderWithProviders(<BudgetsSection />);

    const card = (await screen.findByRole('heading', { name: 'Groceries budget' })).closest('.budget-card');
    expect(figure(card, 'Budgeted')).toHaveTextContent('$200.00');
    expect(figure(card, 'Spent')).toHaveTextContent('$150.00');
    expect(figure(card, 'Remaining')).toHaveTextContent('$50.00');
    expect(within(card).getByText('75% used')).toBeInTheDocument();
    expect(within(card).getByText('Approaching limit')).toBeInTheDocument();
    expect(within(card).getByText('Food · Monthly')).toBeInTheDocument();
    expect(within(card).getByText('Jun 1, 2024 – Jun 30, 2024')).toBeInTheDocument();
  });

  it('says how far over a budget is, never a negative or zero "remaining"', async () => {
    mockApi({ lists: [[outings]] });
    renderWithProviders(<BudgetsSection />);

    const card = (await screen.findByRole('heading', { name: 'Outings' })).closest('.budget-card');
    expect(figure(card, 'Over by')).toHaveTextContent('$80.00');
    expect(within(card).queryByText('Remaining')).not.toBeInTheDocument();
    expect(within(card).getByText('Over budget')).toBeInTheDocument();
    // The bar stops at full; the percentage still says how far past it is
    expect(within(card).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(card.querySelector('.progress-bar-fill').style.width).toBe('100%');
    expect(within(card).getByText('180% used')).toBeInTheDocument();
  });

  it('adds the budgets up: total budgeted minus total spent is the total remaining', async () => {
    mockApi({ lists: [[groceries, outings]] });
    renderWithProviders(<BudgetsSection />);
    await screen.findByRole('heading', { name: 'Outings' });

    expect(overview('Total budgeted')).toHaveTextContent('$300.00');
    expect(overview('Total spent')).toHaveTextContent('$330.00');
    // 300 budgeted - 330 spent: over in total, by 30
    expect(overview('Over in total')).toHaveTextContent('$30.00');
    expect(screen.queryByText('Total remaining')).not.toBeInTheDocument();
  });

  it('filters by period, and the totals follow the budgets shown', async () => {
    mockApi({ lists: [[groceries, outings]] });
    renderWithProviders(<BudgetsSection />);
    await screen.findByRole('heading', { name: 'Outings' });

    const filter = screen.getByRole('group', { name: 'Period' });
    // Only the periods in use are offered
    expect(within(filter).getAllByRole('button').map((b) => b.textContent)).toEqual(['All', 'Weekly', 'Monthly']);

    await userEvent.click(within(filter).getByRole('button', { name: 'Monthly' }));

    expect(screen.getByRole('heading', { name: 'Groceries budget' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Outings' })).not.toBeInTheDocument();
    expect(overview('Total budgeted')).toHaveTextContent('$200.00');
    expect(overview('Total spent')).toHaveTextContent('$150.00');
    expect(overview('Total remaining')).toHaveTextContent('$50.00');
  });

  it('marks a budget whose dates have passed or not begun', async () => {
    const lastMonth = { ...groceries, id: 3, name: 'May groceries', startDate: '2024-05-01T00:00:00.000Z', endDate: '2024-05-31T00:00:00.000Z' };
    const nextMonth = { ...groceries, id: 4, name: 'July groceries', startDate: '2024-07-01T00:00:00.000Z', endDate: '2024-07-31T00:00:00.000Z' };
    mockApi({ lists: [[groceries, lastMonth, nextMonth]] });
    renderWithProviders(<BudgetsSection />);
    await screen.findByRole('heading', { name: 'May groceries' });

    expect(within(cardFor('May groceries')).getByText('Ended')).toBeInTheDocument();
    expect(within(cardFor('July groceries')).getByText('Upcoming')).toBeInTheDocument();
    expect(within(cardFor('Groceries budget')).queryByText(/Ended|Upcoming/)).not.toBeInTheDocument();
  });

  it('links each budget to the expenses it counts: its category, within its dates', async () => {
    mockApi({ lists: [[groceries]] });
    renderWithProviders(<BudgetsSection />);
    await screen.findByRole('heading', { name: 'Groceries budget' });

    expect(screen.getByRole('link', { name: 'View spending' }))
      .toHaveAttribute('href', '/transactions?type=expense&category=food&startDate=2024-06-01&endDate=2024-06-30');
  });

  it('invites a first budget when there are none', async () => {
    mockApi({ lists: [[]] });
    renderWithProviders(<BudgetsSection />);

    const empty = (await screen.findByText(/no budgets yet/i)).closest('.empty-state');
    expect(screen.queryByText('Total budgeted')).not.toBeInTheDocument();
    await userEvent.click(within(empty).getByRole('button', { name: 'Add Budget' }));
    expect(screen.getByRole('dialog', { name: 'Add Budget' })).toBeInTheDocument();
  });

  it('adds a budget from the dialog and shows it', async () => {
    const rent = { ...groceries, id: 5, name: 'Rent budget', category: 'Rent', amount: 500, spent: 0, remaining: 500, percentUsed: 0, status: 'normal' };
    const fetchMock = mockApi({ lists: [[groceries], [groceries, rent]], onWrite: () => ({ status: 201, body: rent }) });
    renderWithProviders(<BudgetsSection />);
    await screen.findByRole('heading', { name: 'Groceries budget' });

    await userEvent.click(screen.getByRole('button', { name: 'Add Budget' }));
    const dialog = screen.getByRole('dialog', { name: 'Add Budget' });
    // A new budget starts as this month's
    expect(within(dialog).getByLabelText('Start date')).toHaveValue('2024-06-01');
    expect(within(dialog).getByLabelText('End date')).toHaveValue('2024-06-30');
    await userEvent.type(within(dialog).getByLabelText('Budget name'), 'Rent budget');
    await userEvent.selectOptions(within(dialog).getByLabelText('Category'), 'Rent');
    await userEvent.type(within(dialog).getByLabelText('Amount'), '500');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }));

    const card = (await screen.findByRole('heading', { name: 'Rent budget' })).closest('.budget-card');
    expect(figure(card, 'Remaining')).toHaveTextContent('$500.00');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const [, options] = fetchMock.mock.calls.find(([, opts]) => opts?.method === 'POST');
    expect(JSON.parse(options.body)).toEqual({
      name: 'Rent budget', category: 'Rent', amount: 500, period: 'monthly', startDate: '2024-06-01', endDate: '2024-06-30',
    });
  });

  it('says what is wrong under each field instead of saving', async () => {
    const fetchMock = mockApi({ lists: [[groceries]] });
    renderWithProviders(<BudgetsSection />);
    await screen.findByRole('heading', { name: 'Groceries budget' });

    await userEvent.click(screen.getByRole('button', { name: 'Add Budget' }));
    const dialog = screen.getByRole('dialog');
    const end = within(dialog).getByLabelText('End date');
    await userEvent.clear(end);
    await userEvent.type(end, '2024-05-31');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }));

    expect(within(dialog).getByText('Enter a name')).toBeInTheDocument();
    expect(within(dialog).getByText('Enter an amount greater than 0')).toBeInTheDocument();
    expect(within(dialog).getByText('The end date must be after the start date')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, opts]) => opts?.method === 'POST')).toBe(false);
  });

  it('edits a budget from the dialog and shows the figures the API works out', async () => {
    const raised = { ...groceries, amount: 300, remaining: 150, percentUsed: 50, status: 'normal' };
    const fetchMock = mockApi({ lists: [[groceries], [raised]], onWrite: () => ({ body: raised }) });
    renderWithProviders(<BudgetsSection />);
    await screen.findByRole('heading', { name: 'Groceries budget' });

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit Budget' });
    expect(within(dialog).getByLabelText('Budget name')).toHaveValue('Groceries budget');
    const amount = within(dialog).getByLabelText('Amount');
    expect(amount).toHaveValue(200);
    await userEvent.clear(amount);
    await userEvent.type(amount, '300');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('50% used')).toBeInTheDocument();
    const card = cardFor('Groceries budget');
    expect(figure(card, 'Budgeted')).toHaveTextContent('$300.00');
    expect(figure(card, 'Spent')).toHaveTextContent('$150.00');
    expect(figure(card, 'Remaining')).toHaveTextContent('$150.00');
    expect(within(card).getByText('On track')).toBeInTheDocument();
    const [url, options] = fetchMock.mock.calls.find(([, opts]) => opts?.method === 'PUT');
    expect(url).toBe('/api/budgets/1');
    expect(JSON.parse(options.body)).toMatchObject({ name: 'Groceries budget', category: 'Food', amount: 300 });
  });

  it('keeps the cards and says why when a delete is refused', async () => {
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(true);
    mockApi({ lists: [[groceries]], onWrite: () => ({ status: 404, body: { error: 'Budget not found' } }) });
    renderWithProviders(<BudgetsSection />);
    await screen.findByRole('heading', { name: 'Groceries budget' });

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Budget not found')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Groceries budget' })).toBeInTheDocument();
    window.confirm = originalConfirm;
  });
});
