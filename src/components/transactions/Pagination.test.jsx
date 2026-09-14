import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from './Pagination.jsx';

describe('Pagination', () => {
  it('renders nothing when total is 0', () => {
    const { container } = render(<Pagination page={1} totalPages={0} total={0} onPageChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('disables "prev" on the first page and "next" on the last page', () => {
    render(<Pagination page={1} totalPages={3} total={75} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
  });

  it('calls onPageChange with page+1 when next is clicked', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={3} total={75} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with page-1 when prev is clicked', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={3} total={75} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: /prev/i }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('disables next on the last page', () => {
    render(<Pagination page={3} totalPages={3} total={75} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });
});
