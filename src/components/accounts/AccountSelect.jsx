import { useTranslation } from 'react-i18next'
import { getUnusedPresetAccounts } from '../../constants/presetAccounts'

// The account picker used wherever money moves (transactions, recurring
// transactions, savings goals): the user's own accounts first, then the
// preset banks and mobile money they haven't used yet.
function AccountSelect({ value, onChange, accounts, required = false }) {
  const { t } = useTranslation();
  const presets = getUnusedPresetAccounts(accounts);
  // Keeps an older transaction's account selectable while editing it, even
  // if it no longer matches one of the user's accounts or a preset.
  const isKnown = [...accounts.map((a) => a.name), ...presets].some(
    (name) => name.toLowerCase() === value.toLowerCase()
  );

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={t('transactions.account')}
      required={required}
    >
      {!value && <option value="" disabled>{t('transactions.account')}</option>}
      {value && !isKnown && <option value={value}>{value}</option>}
      {accounts.length > 0 && (
        <optgroup label={t('accounts.yourAccounts')}>
          {accounts.map((account) => (
            <option key={account.id} value={account.name}>{account.name}</option>
          ))}
        </optgroup>
      )}
      {presets.length > 0 && (
        <optgroup label={t('accounts.presetAccounts')}>
          {presets.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

export default AccountSelect
