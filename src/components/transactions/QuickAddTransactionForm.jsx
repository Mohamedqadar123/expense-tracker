import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { createTransaction } from '../../api/transactions'
import { getAccounts } from '../../api/accounts'
import AccountSelect from '../accounts/AccountSelect.jsx'
import { isIncomeCategory } from '../../constants/incomeCategories'
import Field from '../Field.jsx'

function todayAsDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

// Used both as the quick-add form (self-submits via createTransaction) and,
// when `initialValues` + `onSubmit` are passed, as the edit form for an
// existing transaction (mirrors BudgetForm/SavingsGoalForm/RecurringTransactionForm).
// `defaultAccount` / `defaultType` preset a new transaction, e.g. the Credit
// and Debit buttons on an account. `onCancel` adds a Cancel button.
//
// A transaction's `type` is 'expense' (a debit: money out of the account) or
// 'income' (a credit: money into it). The amount is always stored positive;
// the type alone says which way it moved.
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
  // What is wrong with each field, shown under it after a failed submit.
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Set the moment a save starts. `isSubmitting` only disables the button on
  // the next render, which is too late to stop a fast double click from
  // recording the same transaction twice.
  const isSaving = useRef(false);
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
      .catch(console.error);
  }, []);

  const validate = () => {
    const problems = {};
    if (!description.trim()) problems.description = t('validation.descriptionRequired');
    if (!(Number(amount) > 0)) problems.amount = t('validation.amountPositive');
    if (!date) problems.date = t('validation.dateRequired');
    else if (date > todayAsDateInputValue()) problems.date = t('validation.dateFuture');
    return problems;
  };

  const clearFieldError = (field) => {
    setFieldErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving.current) return;
    const problems = validate();
    setFieldErrors(problems);
    if (Object.keys(problems).length > 0) return;

    isSaving.current = true;
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        description: description.trim(),
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
      isSaving.current = false;
      setIsSubmitting(false);
    }
  };

  const submitLabel = isSubmitting
    ? (isEditing ? t('common.saving') : t('transactions.adding'))
    : (isEditing ? t('common.save') : t('transactions.addTransaction'));

  return (
    // noValidate: the messages under the fields replace the browser's own bubbles
    <form className="inline-form quick-add-form" onSubmit={handleSubmit} noValidate>
      <div className="segmented-toggle" role="group" aria-label={t('reports.type')}>
        <button
          type="button"
          className="expense-toggle"
          aria-pressed={type === 'expense'}
          onClick={() => { setType('expense'); setCategory(expenseCategories[0] || 'food'); }}
        >
          {t('common.expense')}
        </button>
        <button
          type="button"
          className="income-toggle"
          aria-pressed={type === 'income'}
          onClick={() => { setType('income'); setCategory(incomeCategories[0] || 'salary'); }}
        >
          {t('common.income')}
        </button>
      </div>
      <Field label={t('transactions.description')} wide error={fieldErrors.description}>
        <input
          type="text"
          value={description}
          onChange={(e) => { setDescription(e.target.value); clearFieldError('description'); }}
          aria-invalid={Boolean(fieldErrors.description)}
          required
        />
      </Field>
      <Field label={t('transactions.amount')} error={fieldErrors.amount}>
        <input
          type="number"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); clearFieldError('amount'); }}
          aria-invalid={Boolean(fieldErrors.amount)}
          inputMode="decimal"
          min="0.01"
          step="0.01"
          required
        />
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
      <Field label={t('transactions.date')} error={fieldErrors.date}>
        <input
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); clearFieldError('date'); }}
          aria-invalid={Boolean(fieldErrors.date)}
          max={todayAsDateInputValue()}
          required
        />
      </Field>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button type="submit" className="quick-add-submit" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting && <span className="button-spinner" aria-hidden="true" />}
        {submitLabel}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} disabled={isSubmitting}>{t('common.cancel')}</button>
      )}
    </form>
  );
}

export default QuickAddTransactionForm
