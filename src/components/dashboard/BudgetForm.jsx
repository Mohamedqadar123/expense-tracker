import { useState } from 'react'
import { CATEGORIES } from '../../constants/categories'

function BudgetForm({ initialValues, onSubmit, onCancel }) {
  const [category, setCategory] = useState(initialValues?.category || CATEGORIES[0]);
  const [monthlyLimit, setMonthlyLimit] = useState(initialValues?.monthlyLimit ?? '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monthlyLimit || Number(monthlyLimit) <= 0) return;
    await onSubmit({ category, monthlyLimit: Number(monthlyLimit) });
    if (!initialValues) {
      setMonthlyLimit('');
    }
  };

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={!!initialValues}>
        {CATEGORIES.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <input
        type="number"
        placeholder="Monthly limit"
        value={monthlyLimit}
        onChange={(e) => setMonthlyLimit(e.target.value)}
      />
      <button type="submit">{initialValues ? 'Save' : 'Add'}</button>
      {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
    </form>
  );
}

export default BudgetForm
