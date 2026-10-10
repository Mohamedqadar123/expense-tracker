import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { createTransaction } from '../../api/transactions'
import { getAccounts } from '../../api/accounts'
import AccountSelect from '../accounts/AccountSelect.jsx'
import { isIncomeCategory } from '../../constants/incomeCategories'

function todayAsDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

// Used both as the quick-add form (self-submits via createTransaction) and,
// when `initialValues` + `onSubmit` are passed, as the inline edit form for
// an existing transaction (mirrors BudgetForm/SavingsGoalForm/RecurringTransactionForm).
// `defaultAccount` / `defaultType` preset a new transaction, e.g. the Credit
// and Debit buttons on an account.
function QuickAddTransactionForm({
  categories, onSuccess, broadcast = true, initialValues, onSubmit, onCancel, defaultAccount = '', defaultType = 'expense',
}) {
  const { t } = useTranslation();
  const incomeCategories = categories.filter((c) => isIncomeCategory(c));
  const expenseCategories = categories.filter((c) => !isIncomeCategory(c));
  const isEditing = Boolean(initialValues);
  const [description, setDescription] = useState(initialValues?.description || '');
  const [amount, setAmount] = useState(initialValues?.amount ?? '');
  const [type, setType] = useState(initialValues?.type || defaultType);
  const [category, setCategory] = useState(
    initialValues?.category || (defaultType === 'income' ? incomeCategories[0] : expenseCategories[0]) || 'food'
  );
  const [account, setAccount] = useState(initialValues?.account || defaultAccount);
  const [date, setDate] = useState(initialValues?.date ? initialValues.date.slice(0, 10) : todayAsDateInputValue());
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const typeCategories = type === 'income' ? incomeCategories : expenseCategories;
  // Keeps the current category selectable when editing a transaction whose
  // category isn't in the normal list (e.g. a savings-goal transfer).
  const visibleCategories = typeCategories.includes(category) ? typeCategories : [category, ...typeCategories];

  // Every transaction moves money into or out of one of the user's accounts
  // (e.g. "Bank", "EVC"), so one is always selected: the first account by
  // default, until the user picks another.
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
    if (!description || !amount || Number(amount) <= 0 || !date) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        description,
        amount: Number(amount),
        type,
        category,
        account: account || undefined,
        date,
      };

      if (isEditing) {
        await onSubmit(payload);
      } else {
        const transaction = await createTransaction(payload);

        setDescription('');
        setAmount('');
        setType(defaultType);
        setCategory((defaultType === 'income' ? incomeCategories[0] : expenseCategories[0]) || 'food');
        setAccount(defaultAccount || accounts[0]?.name || '');
        setDate(todayAsDateInputValue());

        if (broadcast) {
          window.dispatchEvent(new CustomEvent('transaction:created', { detail: transaction }));
        }
        onSuccess?.(transaction);
      }
    } catch (err) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="inline-form quick-add-form" onSubmit={handleSubmit}>
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
        inputMode="decimal"
        min="0.01"
        step="0.01"
      />
      <div className="segmented-toggle">
        <button
          type="button"
          className="expense-toggle"
          aria-pressed={type === 'expense'}
          onClick={() => { setType('expense'); setCategory(expenseCategories[0] || 'food'); }}
        >
          {t('common.debit')}
        </button>
        <button
          type="button"
          className="income-toggle"
          aria-pressed={type === 'income'}
          onClick={() => { setType('income'); setCategory(incomeCategories[0] || 'salary'); }}
        >
          {t('common.credit')}
        </button>
      </div>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {visibleCategories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <AccountSelect value={account} onChange={setAccount} accounts={accounts} />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        max={todayAsDateInputValue()}
      />
      <button type="submit" className="quick-add-submit" disabled={isSubmitting}>
        {isSubmitting
          ? t('transactions.adding')
          : isEditing ? t('common.save') : t('transactions.addTransaction')}
      </button>
      {isEditing && onCancel && (
        <button type="button" onClick={onCancel}>{t('common.cancel')}</button>
      )}
      {error && <p className="auth-error">{error}</p>}
    </form>
  );
}

export default QuickAddTransactionForm
