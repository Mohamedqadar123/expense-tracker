import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FREQUENCIES, RECURRING_TYPES } from '../../constants/frequencies'
import { CATEGORIES } from '../../constants/categories'
import { isIncomeCategory } from '../../constants/incomeCategories'

function RecurringTransactionForm({ initialValues, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const incomeCategories = CATEGORIES.filter((c) => isIncomeCategory(c));
  const expenseCategories = CATEGORIES.filter((c) => !isIncomeCategory(c));
  const [description, setDescription] = useState(initialValues?.description || '');
  const [amount, setAmount] = useState(initialValues?.amount ?? '');
  const [type, setType] = useState(initialValues?.type || RECURRING_TYPES[1].value);
  const [category, setCategory] = useState(initialValues?.category || expenseCategories[0]);
  const [account, setAccount] = useState(initialValues?.account || '');
  const [frequency, setFrequency] = useState(initialValues?.frequency || FREQUENCIES[2].value);
  const [startDate, setStartDate] = useState(
    initialValues?.startDate ? initialValues.startDate.slice(0, 10) : ''
  );
  const [endDate, setEndDate] = useState(
    initialValues?.endDate ? initialValues.endDate.slice(0, 10) : ''
  );
  const [error, setError] = useState(null);
  const visibleCategories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!description || !amount || Number(amount) <= 0 || !startDate) return;
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
        setAccount('');
        setFrequency(FREQUENCIES[2].value);
        setStartDate('');
        setEndDate('');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="inline-form recurring-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder={t('transactions.descriptionPlaceholder')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="number"
        placeholder={t('transactions.amountPlaceholder')}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <select value={type} onChange={(e) => {
        const newType = e.target.value;
        setType(newType);
        setCategory((newType === 'income' ? incomeCategories : expenseCategories)[0] || CATEGORIES[0]);
      }}>
        {RECURRING_TYPES.map(rt => (
          <option key={rt.value} value={rt.value}>{t(`common.${rt.value === 'income' ? 'credit' : 'debit'}`)}</option>
        ))}
      </select>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {visibleCategories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder={t('transactions.accountOptionalPlaceholder')}
        value={account}
        onChange={(e) => setAccount(e.target.value)}
      />
      <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
        {FREQUENCIES.map(f => (
          <option key={f.value} value={f.value}>{t(`frequencies.${f.value}`)}</option>
        ))}
      </select>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      <span className="inline-form-to">{t('common.to')}</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        placeholder={t('recurring.endDateOptionalPlaceholder')}
      />
      <button type="submit">{initialValues ? t('common.save') : t('common.add')}</button>
      {onCancel && <button type="button" onClick={onCancel}>{t('common.cancel')}</button>}
      {error && <p className="auth-error">{error}</p>}
    </form>
  );
}

export default RecurringTransactionForm
