import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('BudgetsSection', () => {
  it('renders a budget with its computed spent/remaining/percent', async () => {
    mockFetchOnce([budget]);
    render(<BudgetsSection />);

    expect(await screen.findByText('Groceries budget')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('shows an empty state when there are no budgets', async () => {
    mockFetchOnce([]);
    render(<BudgetsSection />);
    expect(await screen.findByText(/no budgets/i)).toBeInTheDocument();
  });
});
