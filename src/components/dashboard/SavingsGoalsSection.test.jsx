import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetchOnce } from '../../testUtils/mockFetch.js';
import SavingsGoalsSection from './SavingsGoalsSection.jsx';

function goal(overrides) {
  return { id: 1, name: 'Emergency fund', targetAmount: 1000, savedAmount: 0, targetDate: null, ...overrides };
}

async function renderWithGoal(overrides) {
  mockFetchOnce([goal(overrides)]);
  const { container } = render(<SavingsGoalsSection />);
  await screen.findByText('Emergency fund');
  return container.querySelector('.progress-bar-fill');
}

describe('SavingsGoalsSection percent-complete calculation', () => {
  it('renders 0% when nothing is saved', async () => {
    const fill = await renderWithGoal({ savedAmount: 0, targetAmount: 1000 });
    expect(fill.style.width).toBe('0%');
  });

  it('renders 50% at the halfway point', async () => {
    const fill = await renderWithGoal({ savedAmount: 500, targetAmount: 1000 });
    expect(fill.style.width).toBe('50%');
  });

  it('renders 100% when fully funded', async () => {
    const fill = await renderWithGoal({ savedAmount: 1000, targetAmount: 1000 });
    expect(fill.style.width).toBe('100%');
  });

  it('clamps to 100% (not 150%) when over-funded', async () => {
    const fill = await renderWithGoal({ savedAmount: 1500, targetAmount: 1000 });
    expect(fill.style.width).toBe('100%');
  });
});

describe('SavingsGoalsSection progress wording', () => {
  it('says how far along a goal is and how much is left', async () => {
    await renderWithGoal({ savedAmount: 250, targetAmount: 1000 });
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('$750.00 to go')).toBeInTheDocument();
  });

  it('says a goal is reached rather than showing nothing or a negative amount left', async () => {
    await renderWithGoal({ savedAmount: 1500, targetAmount: 1000 });
    expect(screen.getByText('Goal reached')).toBeInTheDocument();
    expect(screen.queryByText(/to go/)).not.toBeInTheDocument();
  });

  it('does not call 99.6% saved 100%', async () => {
    await renderWithGoal({ savedAmount: 996, targetAmount: 1000 });
    expect(screen.getByText('99%')).toBeInTheDocument();
    expect(screen.getByText('$4.00 to go')).toBeInTheDocument();
  });
});

describe('SavingsGoalsSection adding money', () => {
  const accounts = [{ id: 1, name: 'Bank', startingBalance: 0, balance: 500 }];

  // Answers by URL and method. `goalLists` are what GET /goals returns, in order.
  function mockApi({ goalLists, onWrite }) {
    let reads = 0;
    const fetchMock = vi.fn(async (url, options = {}) => {
      const method = options.method || 'GET';
      let body;
      let status = 200;
      if (method !== 'GET') {
        ({ body = null, status = 200 } = onWrite?.(url, options) || {});
      } else if (url.includes('/accounts')) {
        body = accounts;
      } else {
        body = goalLists[Math.min(reads, goalLists.length - 1)];
        reads += 1;
      }
      return { ok: status < 400, status, json: async () => body };
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('sends the old total plus the deposit, from the chosen account, leaving the rest of the goal alone', async () => {
    const before = goal({ savedAmount: 200, targetDate: '2025-01-01T00:00:00.000Z' });
    const after = { ...before, savedAmount: 275 };
    const fetchMock = mockApi({ goalLists: [[before], [after]], onWrite: () => ({ body: after }) });
    render(<SavingsGoalsSection />);
    await screen.findByText('Emergency fund');

    await userEvent.click(screen.getByRole('button', { name: 'Add money' }));
    const dialog = screen.getByRole('dialog', { name: 'Add money: Emergency fund' });
    await within(dialog).findByRole('option', { name: 'Bank ($500.00)' });
    await userEvent.type(within(dialog).getByLabelText('Amount to add'), '75');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add money' }));

    expect(await screen.findByText('$275.00 / $1,000.00')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const [url, options] = fetchMock.mock.calls.find(([, opts]) => opts?.method === 'PUT');
    expect(url).toBe('/api/goals/1');
    // No targetDate: the API keeps the one the goal has
    expect(JSON.parse(options.body)).toEqual({ name: 'Emergency fund', targetAmount: 1000, savedAmount: 275, account: 'Bank' });
  });

  it('asks for a real amount before sending anything', async () => {
    const fetchMock = mockApi({ goalLists: [[goal({ savedAmount: 200 })]] });
    render(<SavingsGoalsSection />);
    await screen.findByText('Emergency fund');

    await userEvent.click(screen.getByRole('button', { name: 'Add money' }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add money' }));

    expect(within(dialog).getByText('Enter an amount greater than 0')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, opts]) => opts?.method === 'PUT')).toBe(false);
  });

  it('keeps the dialog and the amount when the account cannot cover it', async () => {
    mockApi({
      goalLists: [[goal({ savedAmount: 200 })]],
      onWrite: () => ({ status: 400, body: { error: '"Bank" only has $500.00 available.' } }),
    });
    render(<SavingsGoalsSection />);
    await screen.findByText('Emergency fund');

    await userEvent.click(screen.getByRole('button', { name: 'Add money' }));
    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Amount to add'), '900');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add money' }));

    expect(await within(dialog).findByText('"Bank" only has $500.00 available.')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Amount to add')).toHaveValue(900);
    expect(screen.getByText('$200.00 / $1,000.00')).toBeInTheDocument();
  });

  it('returns a goal\'s money to the chosen account before deleting it', async () => {
    const saved = goal({ savedAmount: 200 });
    const fetchMock = mockApi({
      goalLists: [[saved], []],
      onWrite: (url, options) => (options.method === 'DELETE' ? { status: 204 } : { body: { ...saved, savedAmount: 0 } }),
    });
    render(<SavingsGoalsSection />);
    await screen.findByText('Emergency fund');

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete Savings Goal' });
    expect(within(dialog).getByText(/this goal holds \$200\.00/i)).toBeInTheDocument();
    await within(dialog).findByRole('option', { name: 'Bank ($500.00)' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Return money and delete' }));

    expect(await screen.findByText(/no savings goals yet/i)).toBeInTheDocument();
    const writes = fetchMock.mock.calls.filter(([, opts]) => opts?.method && opts.method !== 'GET');
    // First the money goes back (saved amount to zero, crediting the account), then the goal goes
    expect(writes.map(([, opts]) => opts.method)).toEqual(['PUT', 'DELETE']);
    expect(JSON.parse(writes[0][1].body)).toEqual({ name: 'Emergency fund', targetAmount: 1000, savedAmount: 0, account: 'Bank' });
    expect(writes[1][0]).toBe('/api/goals/1');
  });

  it('does not delete the goal if returning the money fails', async () => {
    const fetchMock = mockApi({
      goalLists: [[goal({ savedAmount: 200 })]],
      onWrite: () => ({ status: 500, body: { error: 'Something went wrong' } }),
    });
    render(<SavingsGoalsSection />);
    await screen.findByText('Emergency fund');

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Return money and delete' }));

    expect(await within(dialog).findByText('Something went wrong on our side. Please try again in a moment.')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, opts]) => opts?.method === 'DELETE')).toBe(false);
    expect(screen.getByText('$200.00 / $1,000.00')).toBeInTheDocument();
  });

  it('deletes an empty goal after a plain confirmation, with no money to return', async () => {
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(true);
    const fetchMock = mockApi({ goalLists: [[goal({ savedAmount: 0 })], []], onWrite: () => ({ status: 204 }) });
    render(<SavingsGoalsSection />);
    await screen.findByText('Emergency fund');

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText(/no savings goals yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const writes = fetchMock.mock.calls.filter(([, opts]) => opts?.method && opts.method !== 'GET');
    expect(writes.map(([, opts]) => opts.method)).toEqual(['DELETE']);
    window.confirm = originalConfirm;
  });
});
