import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FREQUENCIES, RECURRING_TYPES } from '../../constants/frequencies'
import { CATEGORIES } from '../../constants/categories'
import { BUDGET_CATEGORIES } from '../../constants/budgetCategories'
import { mergeCategories } from '../../utils/mergeCategories'
import { isIncomeCategory } from '../../constants/incomeCategories'
import { getAccounts } from '../../api/accounts'
import AccountSelect from '../accounts/AccountSelect.jsx'
import Field from '../Field.jsx'
import { useSubmitGuard } from '../../hooks/useSubmitGuard.js'

// The same categories the transaction form offers, so a recurring item can
// fall under any budget a one-off transaction can.
const ALL_CATEGORIES = mergeCategories(CATEGORIES, BUDGET_CATEGORIES);

function todayAsDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function RecurringTransactionForm({ initialValues, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const incomeCategories = ALL_CATEGORIES.filter((c) => isIncomeCategory(c));
  const expenseCategories = ALL_CATEGORIES.filter((c) => !isIncomeCategory(c));
  const [description, setDescription] = useState(initialValues?.description || '');
  const [amount, setAmount] = useState(initialValues?.amount ?? '');
  const [type, setType] = useState(initialValues?.type || RECURRING_TYPES[1].value);
  const [category, setCategory] = useState(initialValues?.category || expenseCategories[0]);
  const [account, setAccount] = useState(initialValues?.account || '');
  const [frequency, setFrequency] = useState(initialValues?.frequency || FREQUENCIES[2].value);
  const [startDate, setStartDate] = useState(
    initialValues?.startDate ? initialValues.startDate.slice(0, 10) : todayAsDateInputValue()
  );
  const [endDate, setEndDate] = useState(
    initialValues?.endDate ? initialValues.endDate.slice(0, 10) : ''
  );
  const [error, setError] = useState(null);
  const saving = useSubmitGuard();
  const [accounts, setAccounts] = useState([]);
  const typeCategories = type === 'income' ? incomeCategories : expenseCategories;
  // Keeps the current category selectable when editing an item whose
  // category isn't in the list.
  const visibleCategories = typeCategories.includes(category) ? typeCategories : [category, ...typeCategories];

  // Each occurrence is debited from or credited to one of the user's
  // accounts, so one is always selected (the first by default).
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
    if (!description || !amount || Number(amount) <= 0 || !startDate) return;
    if (!saving.begin()) return;
    try {
      await onSubmit({
        description,
        amount: Number(amount),
        type,
        category,
        account: account || null,
        frequency,
        startDate,
        endDate: endDate || null,
      });
      if (!initialValues) {
        setDescription('');
        setAmount('');
        setType(RECURRING_TYPES[1].value);
        setCategory(expenseCategories[0]);
        setAccount(accounts[0]?.name || '');
        setFrequency(FREQUENCIES[2].value);
        setStartDate(todayAsDateInputValue());
        setEndDate('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      saving.end();
    }
  };

  return (
    <form className="inline-form recurring-form" onSubmit={handleSubmit}>
      <Field label={t('transactions.description')} wide>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </Field>
      <Field label={t('transactions.amount')}>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.01"
          step="0.01"
          required
        />
      </Field>
      <Field label={t('reports.type')}>
        <select value={type} onChange={(e) => {
          const newType = e.target.value;
          setType(newType);
          setCategory((newType === 'income' ? incomeCategories : expenseCategories)[0] || CATEGORIES[0]);
        }}>
          {RECURRING_TYPES.map(rt => (
            <option key={rt.value} value={rt.value}>{t(`common.${rt.value}`)}</option>
          ))}
        </select>
      </Field>
      <Field label={t('transactions.category')}>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {visibleCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </Field>
      <Field label={t('transactions.account')}>
        <AccountSelect value={account} onChange={setAccount} accounts={accounts} />
      </Field>
      <Field label={t('recurring.frequency')}>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          {FREQUENCIES.map(f => (
            <option key={f.value} value={f.value}>{t(`frequencies.${f.value}`)}</option>
          ))}
        </select>
      </Field>
      <Field label={t('common.startDate')}>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </Field>
      <Field label={t('recurring.endDateOptionalPlaceholder')}>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </Field>
      <button type="submit" disabled={saving.isPending} aria-busy={saving.isPending}>
        {saving.isPending && <span className="button-spinner" aria-hidden="true" />}
        {saving.isPending ? t('common.saving') : initialValues ? t('common.save') : t('common.add')}
      </button>
      {onCancel && <button type="button" onClick={onCancel} disabled={saving.isPending}>{t('common.cancel')}</button>}
      {error && <p className="auth-error" role="alert">{error}</p>}
    </form>
  );
}

export default RecurringTransactionForm
