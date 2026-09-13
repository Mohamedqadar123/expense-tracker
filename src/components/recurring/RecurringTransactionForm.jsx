import { useState } from 'react'
import { FREQUENCIES, RECURRING_TYPES } from '../../constants/frequencies'
import { CATEGORIES } from '../../constants/categories'

function RecurringTransactionForm({ initialValues, onSubmit, onCancel }) {
  const [description, setDescription] = useState(initialValues?.description || '');
  const [amount, setAmount] = useState(initialValues?.amount ?? '');
  const [type, setType] = useState(initialValues?.type || RECURRING_TYPES[1].value);
  const [category, setCategory] = useState(initialValues?.category || CATEGORIES[0]);
  const [account, setAccount] = useState(initialValues?.account || '');
  const [frequency, setFrequency] = useState(initialValues?.frequency || FREQUENCIES[2].value);
  const [startDate, setStartDate] = useState(
    initialValues?.startDate ? initialValues.startDate.slice(0, 10) : ''
  );
  const [endDate, setEndDate] = useState(
    initialValues?.endDate ? initialValues.endDate.slice(0, 10) : ''
  );
  const [error, setError] = useState(null);

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
        setCategory(CATEGORIES[0]);
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
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <select value={type} onChange={(e) => setType(e.target.value)}>
        {RECURRING_TYPES.map(t => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Account (optional)"
        value={account}
        onChange={(e) => setAccount(e.target.value)}
      />
      <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
        {FREQUENCIES.map(f => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      <span className="inline-form-to">to</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        placeholder="End date (optional)"
      />
      <button type="submit">{initialValues ? 'Save' : 'Add'}</button>
      {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
      {error && <p className="auth-error">{error}</p>}
    </form>
  );
}

export default RecurringTransactionForm
