import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from './StatCard.jsx';

describe('StatCard', () => {
  it('renders the title and value', () => {
    render(<StatCard title="Total Balance" value="$4755.00" accent="positive" />);
    expect(screen.getByText('Total Balance')).toBeInTheDocument();
    expect(screen.getByText('$4755.00')).toBeInTheDocument();
  });

  it('applies the accent class to the value', () => {
    render(<StatCard title="Total Balance" value="$4755.00" accent="positive" />);
    expect(screen.getByText('$4755.00')).toHaveClass('positive');
  });
});
