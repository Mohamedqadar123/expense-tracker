import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '../../context/ThemeContext.jsx';
import IncomeExpensesChart from './IncomeExpensesChart.jsx';
import SpendingByCategoryChart from './SpendingByCategoryChart.jsx';

// The drawing itself needs a real layout, which the test DOM lacks; these
// cover everything around it: the totals, the legend and the empty states.
function renderChart(chart) {
  return render(<ThemeProvider>{chart}</ThemeProvider>);
}

function totals() {
  return screen.getByRole('list');
}

describe('IncomeExpensesChart', () => {
  it('shows a message instead of a chart when there are no transactions', () => {
    renderChart(<IncomeExpensesChart data={[{ bucket: '2024-06-01', income: 0, expenses: 0 }]} />);
    expect(screen.getByText('No transactions in this period.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows a message when the period has no buckets at all', () => {
    renderChart(<IncomeExpensesChart data={[]} />);
    expect(screen.getByText('No transactions in this period.')).toBeInTheDocument();
  });

  it('totals income only, leaving expenses at zero', () => {
    renderChart(<IncomeExpensesChart data={[
      { bucket: '2024-06-01', income: 1200, expenses: 0 },
      { bucket: '2024-06-02', income: 300.5, expenses: 0 },
    ]} />);
    expect(within(totals()).getByText('$1,500.50')).toBeInTheDocument();
    expect(within(totals()).getByText('$0.00')).toBeInTheDocument();
  });

  it('totals expenses only, leaving income at zero', () => {
    renderChart(<IncomeExpensesChart data={[{ bucket: '2024-06-01', income: 0, expenses: 75 }]} />);
    const [income, expense] = within(totals()).getAllByRole('listitem');
    expect(income).toHaveTextContent('Income$0.00');
    expect(expense).toHaveTextContent('Expense$75.00');
  });

  it('adds up every bucket of a longer range, empty months included', () => {
    renderChart(<IncomeExpensesChart data={[
      { bucket: '2024-01', income: 1000, expenses: 400 },
      { bucket: '2024-02', income: 0, expenses: 0 },
      { bucket: '2024-03', income: 1000, expenses: 250 },
    ]} />);
    const [income, expense] = within(totals()).getAllByRole('listitem');
    expect(income).toHaveTextContent('$2,000.00');
    expect(expense).toHaveTextContent('$650.00');
  });
});

describe('SpendingByCategoryChart', () => {
  it('shows a message instead of a chart when nothing was spent', () => {
    renderChart(<SpendingByCategoryChart data={[]} />);
    expect(screen.getByText('No expenses in this period.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('lists each category with its amount and share, largest first, under the total', () => {
    renderChart(<SpendingByCategoryChart data={[
      { category: 'food', amount: 50 },
      { category: 'housing', amount: 150 },
    ]} />);

    expect(screen.getByText('Total spent').parentElement).toHaveTextContent('$200.00');
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('housing$150.0075%');
    expect(rows[1]).toHaveTextContent('food$50.0025%');
  });

  it('leaves out categories with nothing spent', () => {
    renderChart(<SpendingByCategoryChart data={[
      { category: 'food', amount: 80 },
      { category: 'transport', amount: 0 },
    ]} />);
    expect(screen.queryByText('transport')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('listitem')).toHaveTextContent('food$80.00100%');
  });

  it('shows shares that add up to 100 and never calls a real amount 0%', () => {
    renderChart(<SpendingByCategoryChart data={[
      { category: 'a', amount: 100 },
      { category: 'b', amount: 100 },
      { category: 'c', amount: 100 },
      { category: 'tiny', amount: 0.5 },
    ]} />);
    const shares = screen.getAllByRole('listitem').map((row) => row.lastChild.textContent);
    expect(shares).toEqual(['34%', '33%', '33%', '<1%']);
  });

  it('adds the smallest categories together once there are more than seven', () => {
    const data = [900, 800, 700, 600, 500, 400, 30, 20, 10].map((amount, index) => ({ category: `cat${index}`, amount }));
    renderChart(<SpendingByCategoryChart data={data} />);

    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(7);
    expect(rows[6]).toHaveTextContent('Other categories$60.00');
    // Nothing is lost by the grouping: the total is still every category
    expect(screen.getByText('Total spent').parentElement).toHaveTextContent('$3,960.00');
  });
});
