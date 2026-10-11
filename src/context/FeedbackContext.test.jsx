import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackProvider } from './FeedbackContext.jsx';
import { useFeedback } from './useFeedback.js';

function DeleteButton() {
  const { confirm, notify } = useFeedback();
  const [answer, setAnswer] = useState('not asked');

  const handleClick = async () => {
    const confirmed = await confirm('Delete this budget?', 'Delete');
    setAnswer(confirmed ? 'confirmed' : 'cancelled');
    if (confirmed) notify('Deleted');
  };

  return (
    <>
      <button onClick={handleClick}>Remove</button>
      <p>{answer}</p>
    </>
  );
}

function renderDeleteButton() {
  render(<FeedbackProvider><DeleteButton /></FeedbackProvider>);
}

describe('FeedbackProvider', () => {
  it('resolves true and shows the message when the question is confirmed', async () => {
    renderDeleteButton();
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(screen.getByRole('alertdialog')).toHaveTextContent('Delete this budget?');
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('confirmed')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Deleted');
  });

  it('resolves false and shows no message when the question is cancelled', async () => {
    renderDeleteButton();
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByText('cancelled')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('cancels when Escape is pressed', async () => {
    renderDeleteButton();
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await userEvent.keyboard('{Escape}');

    expect(await screen.findByText('cancelled')).toBeInTheDocument();
  });
});
