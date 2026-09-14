import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
