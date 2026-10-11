import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PRESET_ACCOUNTS } from '../../constants/presetAccounts'

function AccountForm({ initialValues, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialValues?.name || '');
  const [startingBalance, setStartingBalance] = useState(initialValues?.startingBalance ?? '');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return;
    try {
      await onSubmit({
        name: name.trim(),
        startingBalance: startingBalance === '' ? 0 : Number(startingBalance),
      });
      if (!initialValues) {
        setName('');
        setStartingBalance('');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder={t('accounts.namePlaceholder')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        list="preset-account-names"
      />
      <datalist id="preset-account-names">
        {PRESET_ACCOUNTS.map((preset) => <option key={preset} value={preset} />)}
      </datalist>
      <input
        type="number"
        placeholder={t('accounts.startingBalancePlaceholder')}
        value={startingBalance}
        onChange={(e) => setStartingBalance(e.target.value)}
        step="0.01"
      />
      <button type="submit">{initialValues ? t('common.save') : t('common.add')}</button>
      {onCancel && <button type="button" onClick={onCancel}>{t('common.cancel')}</button>}
      {error && <p className="auth-error">{error}</p>}
    </form>
  );
}

export default AccountForm
