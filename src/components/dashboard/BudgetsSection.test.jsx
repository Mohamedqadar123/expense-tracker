import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetchOnce } from '../../testUtils/mockFetch.js';
import BudgetsSection from './BudgetsSection.jsx';

const budget = {
  id: 1,
  name: 'Groceries budget',
  category: 'Food',
  period: 'monthly',
  amount: 200,
  spent: 150,
  remaining: 50,
  percentUsed: 75,
  status: 'warning',
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: '2024-01-31T00:00:00.000Z',
};

// Answers by method: `lists` are what GET returns, in order (the last repeats).
function mockApi({ lists, onWrite }) {
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

describe('BudgetsSection', () => {
  it('renders a budget with its computed spent/remaining/percent', async () => {
    mockFetchOnce([budget]);
    render(<BudgetsSection />);

    expect(await screen.findByText('Groceries budget')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('$50.00 remaining')).toBeInTheDocument();
    expect(screen.getByText('Approaching limit')).toBeInTheDocument();
  });

  it('shows an empty state when there are no budgets', async () => {
    mockFetchOnce([]);
    render(<BudgetsSection />);
    expect(await screen.findByText(/no budgets/i)).toBeInTheDocument();
  });

  it('says how far over a budget is, instead of "$0.00 remaining"', async () => {
    mockFetchOnce([{ ...budget, spent: 280, remaining: -80, percentUsed: 140, status: 'exceeded' }]);
    render(<BudgetsSection />);

    expect(await screen.findByText('Over by $80.00')).toBeInTheDocument();
    expect(screen.queryByText(/remaining/)).not.toBeInTheDocument();
    expect(screen.getByText('Over budget')).toBeInTheDocument();
  });

  it('adds a budget from the dialog and shows it', async () => {
    const rent = { ...budget, id: 2, name: 'Rent budget', category: 'Rent', amount: 500, spent: 0, remaining: 500, percentUsed: 0, status: 'normal' };
    const fetchMock = mockApi({ lists: [[budget], [budget, rent]], onWrite: () => ({ status: 201, body: rent }) });
    render(<BudgetsSection />);
    await screen.findByText('Groceries budget');

    await userEvent.click(screen.getByRole('button', { name: 'Add Budget' }));
    const dialog = screen.getByRole('dialog', { name: 'Add Budget' });
    await userEvent.type(within(dialog).getByLabelText('Budget name'), 'Rent budget');
    await userEvent.selectOptions(within(dialog).getByLabelText('Category'), 'Rent');
    await userEvent.type(within(dialog).getByLabelText('Amount'), '500');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Rent budget')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const [, options] = fetchMock.mock.calls.find(([, opts]) => opts?.method === 'POST');
    expect(JSON.parse(options.body)).toMatchObject({ name: 'Rent budget', category: 'Rent', amount: 500, period: 'monthly' });
  });

  it('opens a budget for editing with its own values', async () => {
    mockFetchOnce([budget]);
    render(<BudgetsSection />);
    await screen.findByText('Groceries budget');

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));

    const dialog = screen.getByRole('dialog', { name: 'Edit Budget' });
    expect(within(dialog).getByLabelText('Budget name')).toHaveValue('Groceries budget');
    expect(within(dialog).getByLabelText('Amount')).toHaveValue(200);
    expect(within(dialog).getByLabelText('Start date')).toHaveValue('2024-01-01');
  });

  it('keeps the list and says why when a delete is refused', async () => {
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(true);
    mockApi({ lists: [[budget]], onWrite: () => ({ status: 404, body: { error: 'Budget not found' } }) });
    render(<BudgetsSection />);
    await screen.findByText('Groceries budget');

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Budget not found')).toBeInTheDocument();
    expect(screen.getByText('Groceries budget')).toBeInTheDocument();
    window.confirm = originalConfirm;
  });
});
