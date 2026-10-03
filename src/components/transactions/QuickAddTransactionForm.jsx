import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { createTransaction } from '../../api/transactions'
import { getAccounts } from '../../api/accounts'
import { isIncomeCategory } from '../../constants/incomeCategories'

function todayAsDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

// Used both as the quick-add form (self-submits via createTransaction) and,
// when `initialValues` + `onSubmit` are passed, as the inline edit form for
// an existing transaction (mirrors BudgetForm/SavingsGoalForm/RecurringTransactionForm).
function QuickAddTransactionForm({ categories, onSuccess, broadcast = true, initialValues, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const incomeCategories = categories.filter((c) => isIncomeCategory(c));
  const expenseCategories = categories.filter((c) => !isIncomeCategory(c));
  const isEditing = Boolean(initialValues);
  const [description, setDescription] = useState(initialValues?.description || '');
  const [amount, setAmount] = useState(initialValues?.amount ?? '');
  const [type, setType] = useState(initialValues?.type || 'expense');
  const [category, setCategory] = useState(initialValues?.category || expenseCategories[0] || 'food');
  const [account, setAccount] = useState(initialValues?.account || '');
  const [date, setDate] = useState(initialValues?.date ? initialValues.date.slice(0, 10) : todayAsDateInputValue());
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const visibleCategories = type === 'income' ? incomeCategories : expenseCategories;

  // Real accounts (e.g. "Bank", "EVC") the user set up on the Accounts page —
  // picking one here is what ties a transaction to that account's balance.
  // Falls back to the old free-text field for users with none set up yet.
  useEffect(() => {
    getAccounts()
      .then((data) => setAccounts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Keeps a legacy/custom account value (e.g. from editing an older
  // transaction) selectable even if it no longer matches a real account.
  const accountOptions = accounts.some((a) => a.name.toLowerCase() === account.toLowerCase()) || !account
    ? accounts
    : [{ id: 'custom', name: account }, ...accounts];

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
        setType('expense');
        setCategory(expenseCategories[0] || 'food');
        setAccount('');
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
      {accounts.length > 0 ? (
        <select value={account} onChange={(e) => setAccount(e.target.value)}>
          <option value="">{t('accounts.noAccount')}</option>
          {accountOptions.map((a) => (
            <option key={a.id} value={a.name}>{a.name}</option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          placeholder={t('transactions.accountOptionalPlaceholder')}
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        />
      )}
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
