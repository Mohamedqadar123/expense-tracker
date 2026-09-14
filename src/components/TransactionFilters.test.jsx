import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionFilters from './TransactionFilters.jsx';

const baseFilters = {
  search: '', type: 'all', category: 'all', account: 'all',
  startDate: '', endDate: '', minAmount: '', maxAmount: '', sort: 'newest',
};

describe('TransactionFilters', () => {
  it('calls onChange with the new type when the type select changes', async () => {
    const onChange = vi.fn();
    render(<TransactionFilters filters={baseFilters} onChange={onChange} categories={['Food']} accounts={['Checking']} />);

    await userEvent.selectOptions(screen.getByDisplayValue('All Types'), 'income');
    expect(onChange).toHaveBeenCalledWith({ type: 'income' });
  });

  it('calls onChange with the new category when the category select changes', async () => {
    const onChange = vi.fn();
    render(<TransactionFilters filters={baseFilters} onChange={onChange} categories={['Food', 'Rent']} accounts={[]} />);

    await userEvent.selectOptions(screen.getByDisplayValue('All Categories'), 'Rent');
    expect(onChange).toHaveBeenCalledWith({ category: 'Rent' });
  });

  it('resets all filters when "Clear Filters" is clicked', async () => {
    const onChange = vi.fn();
    render(<TransactionFilters filters={{ ...baseFilters, type: 'income' }} onChange={onChange} categories={[]} accounts={[]} />);

    await userEvent.click(screen.getByRole('button', { name: /clear filters/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'all', category: 'all', sort: 'newest' }));
  });

  it('updates the start date field', async () => {
    const onChange = vi.fn();
    const { container } = render(<TransactionFilters filters={baseFilters} onChange={onChange} categories={[]} accounts={[]} />);

    const [startInput] = container.querySelectorAll('input[type="date"]');
    fireEvent.change(startInput, { target: { value: '2024-01-01' } });
    expect(onChange).toHaveBeenCalledWith({ startDate: '2024-01-01' });
  });
});
