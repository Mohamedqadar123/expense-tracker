import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import StatCardsRow from './StatCardsRow.jsx';

function cardValue(title) {
  const card = screen.getByText(title).closest('.stat-card');
  return within(card).getByText((_, el) => el.classList.contains('stat-value'));
}

describe('StatCardsRow', () => {
  it('renders the exact example (income $5000, expenses $245, balance $4755) correctly formatted', () => {
    render(<StatCardsRow summary={{ totalBalance: 4755, income: 5000, expenses: 245, savings: 4755, savingsRate: 95.1 }} />);

    expect(cardValue('Total Balance')).toHaveTextContent('$4755.00');
    expect(cardValue('Total Income')).toHaveTextContent('$5000.00');
    expect(cardValue('Total Expenses')).toHaveTextContent('$245.00');
    expect(cardValue('Savings Rate')).toHaveTextContent('95%');
  });

  it('renders a negative balance with the negative accent class', () => {
    render(<StatCardsRow summary={{ totalBalance: -100, income: 0, expenses: 100, savings: -100, savingsRate: null }} />);
    expect(cardValue('Total Balance')).toHaveTextContent('$-100.00');
    expect(cardValue('Total Balance')).toHaveClass('negative');
  });

  it('renders "N/A" (not "nullaN" or a crash) when savingsRate is null', () => {
    render(<StatCardsRow summary={{ totalBalance: 0, income: 0, expenses: 100, savings: -100, savingsRate: null }} />);
    expect(screen.queryByText(/nullaN/i)).not.toBeInTheDocument();
    expect(cardValue('Savings Rate')).toHaveTextContent('N/A');
  });
});
