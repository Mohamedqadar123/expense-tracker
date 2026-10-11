import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getAccounts } from '../../api/accounts'
import AccountSelect from '../accounts/AccountSelect.jsx'
import Field from '../Field.jsx'
import { formatCurrency } from '../../utils/format'
import { useSubmitGuard } from '../../hooks/useSubmitGuard.js'

// Deleting a goal that still holds money: says how much, and asks which
// account it goes back to, since a goal does not remember where its money
// came from. `onSubmit` receives the account name and may throw, in which
// case the reason is shown.
function GoalRemoveForm({ goal, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const [account, setAccount] = useState('');
  const [accounts, setAccounts] = useState([]);
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
    if (!saving.begin()) return;
    try {
      await onSubmit(account || undefined);
    } catch (err) {
      setError(err.message);
    } finally {
      saving.end();
    }
  };

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <p className="form-note">{t('goals.deleteWithMoney', { amount: formatCurrency(goal.savedAmount) })}</p>
      <Field label={t('goals.returnTo')}>
        <AccountSelect value={account} onChange={setAccount} accounts={accounts} />
      </Field>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button type="submit" className="form-danger-button" disabled={saving.isPending} aria-busy={saving.isPending}>
        {saving.isPending && <span className="button-spinner" aria-hidden="true" />}
        {saving.isPending ? t('common.saving') : t('goals.returnAndDelete')}
      </button>
      <button type="button" onClick={onCancel} disabled={saving.isPending}>{t('common.cancel')}</button>
    </form>
  );
}

export default GoalRemoveForm
