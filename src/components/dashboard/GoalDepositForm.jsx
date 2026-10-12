import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getAccounts } from '../../api/accounts'
import AccountSelect from '../accounts/AccountSelect.jsx'
import Field from '../Field.jsx'
import { useSubmitGuard } from '../../hooks/useSubmitGuard.js'

// Puts more money into a savings goal: an amount and the account it comes
// out of. `onSubmit` receives { amount, account } and may throw (e.g. the
// account cannot cover it), in which case the reason is shown and what was
// typed is kept.
function GoalDepositForm({ onSubmit, onCancel }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [amountError, setAmountError] = useState(null);
  const [error, setError] = useState(null);
  const saving = useSubmitGuard();

  useEffect(() => {
    getAccounts()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setAccounts(list);
        setAccount((current) => current || list[0]?.name || '');
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!(Number(amount) > 0)) {
      setAmountError(t('validation.amountPositive'));
      return;
    }
    if (!saving.begin()) return;
    try {
      await onSubmit({ amount: Number(amount), account: account || undefined });
    } catch (err) {
      setError(err.message);
    } finally {
      saving.end();
    }
  };

  return (
    <form className="inline-form" onSubmit={handleSubmit} noValidate>
      <Field label={t('goals.amountToAdd')} error={amountError}>
        <input
          type="number"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setAmountError(null); }}
          aria-invalid={Boolean(amountError)}
          inputMode="decimal"
          min="0.01"
          step="0.01"
          required
        />
      </Field>
      <Field label={t('transactions.account')}>
        <AccountSelect value={account} onChange={setAccount} accounts={accounts} />
      </Field>
      <p className="form-hint">{t('goals.accountHint')}</p>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button type="submit" disabled={saving.isPending} aria-busy={saving.isPending}>
        {saving.isPending && <span className="button-spinner" aria-hidden="true" />}
        {saving.isPending ? t('common.saving') : t('goals.addMoney')}
      </button>
      <button type="button" onClick={onCancel} disabled={saving.isPending}>{t('common.cancel')}</button>
    </form>
  );
}

export default GoalDepositForm
