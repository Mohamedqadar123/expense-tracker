import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getAccounts } from '../../api/accounts'
import AccountSelect from '../accounts/AccountSelect.jsx'

function SavingsGoalForm({ initialValues, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialValues?.name || '');
  const [targetAmount, setTargetAmount] = useState(initialValues?.targetAmount ?? '');
  const [savedAmount, setSavedAmount] = useState(initialValues?.savedAmount ?? 0);
  const [targetDate, setTargetDate] = useState(initialValues?.targetDate ? initialValues.targetDate.slice(0, 10) : '');
  const [error, setError] = useState(null);
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
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name || !targetAmount || Number(targetAmount) <= 0) return;
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
    }
  };

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <input type="text" placeholder={t('goals.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
      <input type="number" placeholder={t('goals.targetAmountPlaceholder')} value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} min="0.01" step="0.01" />
      <input type="number" placeholder={t('goals.savedSoFarPlaceholder')} value={savedAmount} onChange={(e) => setSavedAmount(e.target.value)} min="0" step="0.01" />
      <AccountSelect value={account} onChange={setAccount} accounts={accounts} />
      <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
      <button type="submit">{initialValues ? t('common.save') : t('common.add')}</button>
      {onCancel && <button type="button" onClick={onCancel}>{t('common.cancel')}</button>}
      {error && <p className="auth-error">{error}</p>}
      <p className="form-hint">{t('goals.accountHint')}</p>
    </form>
  );
}

export default SavingsGoalForm
