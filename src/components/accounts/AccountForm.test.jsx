import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountForm from './AccountForm.jsx';

// A save that stays pending until the test settles it.
function pendingSave() {
  let resolve;
  let reject;
  const onSubmit = vi.fn(() => new Promise((res, rej) => { resolve = res; reject = rej; }));
  return { onSubmit, succeed: () => resolve(), fail: (message) => reject(new Error(message)) };
}

async function fillIn(name, startingBalance) {
  await userEvent.type(screen.getByLabelText('Account name'), name);
  await userEvent.type(screen.getByLabelText('Starting balance'), startingBalance);
}

describe('AccountForm', () => {
  it('saves once and shows it is saving, however many times the button is clicked', async () => {
    const save = pendingSave();
    render(<AccountForm onSubmit={save.onSubmit} onCancel={vi.fn()} />);
    await fillIn('Cash', '60');

    const submit = screen.getByRole('button', { name: 'Add' });
    await userEvent.dblClick(submit);

    expect(save.onSubmit).toHaveBeenCalledTimes(1);
    expect(save.onSubmit).toHaveBeenCalledWith({ name: 'Cash', startingBalance: 60 });
    expect(submit).toBeDisabled();
    expect(submit).toHaveTextContent('Saving…');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

    save.succeed();
    await waitFor(() => expect(submit).toBeEnabled());
    expect(submit).toHaveTextContent('Add');
    // A new account's form empties for the next one
    expect(screen.getByLabelText('Account name')).toHaveValue('');
  });

  it('keeps what was typed and shows the reason when the save fails, ready to try again', async () => {
    const save = pendingSave();
    render(<AccountForm onSubmit={save.onSubmit} />);
    await fillIn('Cash', '60');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    save.fail('An account named "Cash" already exists');

    expect(await screen.findByRole('alert')).toHaveTextContent('An account named "Cash" already exists');
    expect(screen.getByLabelText('Account name')).toHaveValue('Cash');
    expect(screen.getByLabelText('Starting balance')).toHaveValue(60);
    expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(save.onSubmit).toHaveBeenCalledTimes(2);
  });
});
