import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../testUtils/renderWithProviders.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import RecurringTransactionForm from '../components/recurring/RecurringTransactionForm.jsx';
import Calculator from './Calculator.jsx';
import Reports from './Reports.jsx';

function stubFetch(answer) {
  const fetchMock = vi.fn(async (url) => ({ ok: true, status: 200, json: async () => answer(url) }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('RecurringTransactionForm', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    stubFetch(() => []);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts today unless told otherwise, so it can be saved without hunting for the date', () => {
    render(<RecurringTransactionForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText('Start date')).toHaveValue('2024-06-15');
  });

  it('keeps the start date of an item being edited', () => {
    render(<RecurringTransactionForm
      onSubmit={vi.fn()}
      initialValues={{ description: 'Rent', amount: 200, type: 'expense', category: 'Rent', frequency: 'monthly', startDate: '2024-01-01T00:00:00.000Z' }}
    />);
    expect(screen.getByLabelText('Start date')).toHaveValue('2024-01-01');
    expect(screen.getByLabelText('Category')).toHaveValue('Rent');
  });

  it('names the two types Expense and Income, and offers every budget category', () => {
    render(<RecurringTransactionForm onSubmit={vi.fn()} />);

    const type = screen.getByLabelText('Type');
    expect(within(type).getAllByRole('option').map((option) => option.textContent)).toEqual(['Income', 'Expense']);
    // Still an expense by default: the wording changed, not what is saved
    expect(type).toHaveValue('expense');

    const categories = within(screen.getByLabelText('Category')).getAllByRole('option').map((option) => option.value);
    expect(categories).toEqual(expect.arrayContaining(['food', 'Rent', 'Shopping', 'Healthcare']));
    expect(categories).not.toContain('salary');
  });
});

describe('Calculator keyboard shortcuts', () => {
  function display() {
    return document.querySelector('.calculator-value').textContent;
  }

  it('takes digits and operators typed anywhere on the page', () => {
    renderWithProviders(<Calculator />);
    fireEvent.keyDown(document.body, { key: '7' });
    fireEvent.keyDown(document.body, { key: '+' });
    fireEvent.keyDown(document.body, { key: '5' });
    fireEvent.keyDown(document.body, { key: 'Enter' });
    expect(display()).toBe('12');
  });

  it('leaves keys typed into a field or a dialog alone', () => {
    renderWithProviders(
      <>
        <Calculator />
        <div role="dialog"><input aria-label="Description" /><button type="button">Save</button></div>
      </>
    );
    const field = screen.getByLabelText('Description');

    fireEvent.keyDown(field, { key: '9' });
    expect(display()).toBe('0');
    // Not swallowed either: "/" can be typed and Enter can submit the form
    expect(fireEvent.keyDown(field, { key: '/' })).toBe(true);
    expect(fireEvent.keyDown(field, { key: 'Enter' })).toBe(true);
    expect(fireEvent.keyDown(screen.getByRole('button', { name: 'Save' }), { key: 'Enter' })).toBe(true);
    expect(display()).toBe('0');
  });

  it('leaves browser shortcuts such as Ctrl+1 alone', () => {
    renderWithProviders(<Calculator />);
    fireEvent.keyDown(document.body, { key: '1', ctrlKey: true });
    expect(display()).toBe('0');
  });
});

describe('Reports', () => {
  const overview = {
    summary: { totalBalance: 750, income: 1000, expenses: 250, savings: 750, savingsRate: 75 },
    expenseByCategory: [{ category: 'food', amount: 250 }],
    incomeByCategory: [{ category: 'salary', amount: 1000 }],
    dailyCashFlow: [],
    monthlyCashFlow: [],
    budgetProgress: [{
      id: 1, name: 'Groceries', category: 'Food', period: 'monthly', amount: 200, spent: 250, remaining: -50,
      percentUsed: 125, status: 'exceeded', startDate: '2024-06-01T00:00:00.000Z', endDate: '2024-06-30T00:00:00.000Z',
    }],
    transactions: [
      { id: 1, description: 'Pay', category: 'salary', type: 'income', amount: 1000, date: '2024-06-01T00:00:00.000Z' },
      { id: 2, description: 'Shop', category: 'food', type: 'expense', amount: 250, date: '2024-06-02T00:00:00.000Z' },
    ],
  };

  function card(title) {
    return screen.getByText(title).closest('.stat-card');
  }

  function renderReports() {
    return renderWithProviders(<ThemeProvider><Reports /></ThemeProvider>);
  }

  it('shows the balance the accounts hold, starting balances included, like the dashboard', async () => {
    stubFetch((url) => (url.includes('/accounts')
      ? [{ id: 1, name: 'Bank', startingBalance: 500, balance: 1250 }]
      : overview));
    renderReports();

    await waitFor(() => expect(within(card('Account Balance')).getByText('$1,250.00')).toBeInTheDocument());
    expect(within(card('Net Savings')).getByText('$750.00')).toBeInTheDocument();
  });

  it('falls back to the overview\'s own balance when the accounts cannot be read', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => (url.includes('/accounts')
      ? { ok: false, status: 404, json: async () => ({}) }
      : { ok: true, status: 200, json: async () => overview })));
    renderReports();

    await waitFor(() => expect(within(card('Account Balance')).getByText('$750.00')).toBeInTheDocument());
  });

  it('breaks income and expenses down by category, each with its own total', async () => {
    stubFetch((url) => (url.includes('/accounts') ? [] : overview));
    renderReports();

    const expenses = (await screen.findByText('Expense by Category')).closest('.chart-card');
    expect(within(expenses).getByText('Total spent').parentElement).toHaveTextContent('$250.00');
    const income = screen.getByText('Income by Category').closest('.chart-card');
    expect(within(income).getByText('Total Income').parentElement).toHaveTextContent('$1,000.00');
    expect(within(income).getByRole('listitem')).toHaveTextContent('salary$1,000.00100%');
  });

  it('reports an overspent budget as over, in words the reader\'s language has', async () => {
    stubFetch((url) => (url.includes('/accounts') ? [] : overview));
    renderReports();

    expect(await screen.findByText('Over by $50.00')).toBeInTheDocument();
    expect(screen.getByText('Over budget')).toBeInTheDocument();
  });

  it('marks money in and money out differently in the transactions table', async () => {
    stubFetch((url) => (url.includes('/accounts') ? [] : overview));
    renderReports();

    expect(await screen.findByText('+$1,000.00')).toHaveClass('income-amount');
    expect(screen.getByText('-$250.00')).toHaveClass('expense-amount');
  });
});
