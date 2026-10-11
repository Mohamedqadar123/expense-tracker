import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getAccounts } from '../../api/accounts'
import AccountSelect from '../accounts/AccountSelect.jsx'
import Field from '../Field.jsx'
import { useSubmitGuard } from '../../hooks/useSubmitGuard.js'

function SavingsGoalForm({ initialValues, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialValues?.name || '');
  const [targetAmount, setTargetAmount] = useState(initialValues?.targetAmount ?? '');
  const [savedAmount, setSavedAmount] = useState(initialValues?.savedAmount ?? 0);
  const [targetDate, setTargetDate] = useState(initialValues?.targetDate ? initialValues.targetDate.slice(0, 10) : '');
  const [error, setError] = useState(null);
  const saving = useSubmitGuard();
  const [accounts, setAccounts] = useState([]);
  const [account, setAccount] = useState('');

  // Money saved towards a goal is taken out of one of the user's accounts
  // (and put back there if the saved amount is lowered).
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
    if (!name || !targetAmount || Number(targetAmount) <= 0) return;
    if (!saving.begin()) return;
    try {
      await onSubmit({
        name,
        targetAmount: Number(targetAmount),
        savedAmount: Number(savedAmount) || 0,
        account: account || undefined,
        targetDate: targetDate || null,
      });
      if (!initialValues) {
        setName('');
        setTargetAmount('');
        setSavedAmount(0);
        setTargetDate('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      saving.end();
    }
  };

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <Field label={t('goals.namePlaceholder')} wide>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label={t('goals.targetAmountPlaceholder')}>
        <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} min="0.01" step="0.01" required />
      </Field>
      <Field label={t('goals.savedSoFarPlaceholder')}>
        <input type="number" value={savedAmount} onChange={(e) => setSavedAmount(e.target.value)} min="0" step="0.01" />
      </Field>
      <Field label={t('transactions.account')}>
        <AccountSelect value={account} onChange={setAccount} accounts={accounts} />
      </Field>
      <Field label={t('goals.targetDate')}>
        <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
      </Field>
      <button type="submit" disabled={saving.isPending} aria-busy={saving.isPending}>
        {saving.isPending && <span className="button-spinner" aria-hidden="true" />}
        {saving.isPending ? t('common.saving') : initialValues ? t('common.save') : t('common.add')}
      </button>
      {onCancel && <button type="button" onClick={onCancel} disabled={saving.isPending}>{t('common.cancel')}</button>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <p className="form-hint">{t('goals.accountHint')}</p>
    </form>
  );
}

export default SavingsGoalForm
