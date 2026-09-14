import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createTransaction } from '../../api/transactions'
import { isIncomeCategory } from '../../constants/incomeCategories'

function QuickAddTransactionForm({ categories, onSuccess, broadcast = true }) {
  const { t } = useTranslation();
  const incomeCategories = categories.filter((c) => isIncomeCategory(c));
  const expenseCategories = categories.filter((c) => !isIncomeCategory(c));
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState(expenseCategories[0] || 'food');
  const [account, setAccount] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const visibleCategories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const transaction = await createTransaction({
        description,
        amount: Number(amount),
        type,
        category,
        account: account || undefined,
      });

      setDescription('');
      setAmount('');
      setType('expense');
      setCategory(expenseCategories[0] || 'food');
      setAccount('');

      if (broadcast) {
        window.dispatchEvent(new CustomEvent('transaction:created', { detail: transaction }));
      }
      onSuccess?.(transaction);
    } catch (err) {
      setError(err.message || 'Failed to add transaction');
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
      <input
        type="text"
        placeholder={t('transactions.accountOptionalPlaceholder')}
        value={account}
        onChange={(e) => setAccount(e.target.value)}
      />
      <button type="submit" className="quick-add-submit" disabled={isSubmitting}>
        {isSubmitting ? t('transactions.adding') : t('transactions.addTransaction')}
      </button>
      {error && <p className="auth-error">{error}</p>}
    </form>
  );
}

export default QuickAddTransactionForm
