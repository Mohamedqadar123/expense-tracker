import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BUDGET_CATEGORIES, BUDGET_PERIODS } from '../../constants/budgetCategories'
import { computePeriodDates } from '../../utils/budgetPeriod'

function BudgetForm({ initialValues, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialValues?.name || '');
  const [category, setCategory] = useState(initialValues?.category || BUDGET_CATEGORIES[0]);
  const [amount, setAmount] = useState(initialValues?.amount ?? '');
  const [period, setPeriod] = useState(initialValues?.period || 'monthly');
  const defaultDates = initialValues ? null : computePeriodDates('monthly');
  const [startDate, setStartDate] = useState(
    initialValues?.startDate ? initialValues.startDate.slice(0, 10) : defaultDates?.start || ''
  );
  const [endDate, setEndDate] = useState(
    initialValues?.endDate ? initialValues.endDate.slice(0, 10) : defaultDates?.end || ''
  );
  const [error, setError] = useState(null);

  const handlePeriodChange = (nextPeriod) => {
    setPeriod(nextPeriod);
    const computed = computePeriodDates(nextPeriod);
    if (computed) {
      setStartDate(computed.start);
      setEndDate(computed.end);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name || !amount || Number(amount) <= 0 || !startDate || !endDate) return;
    try {
      await onSubmit({ name, category, amount: Number(amount), period, startDate, endDate });
      if (!initialValues) {
        setName('');
        setAmount('');
        setPeriod('monthly');
        const computed = computePeriodDates('monthly');
        setStartDate(computed.start);
        setEndDate(computed.end);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="inline-form budget-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder={t('budgets.namePlaceholder')}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {BUDGET_CATEGORIES.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <input
        type="number"
        placeholder={t('budgets.amountPlaceholder')}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <select value={period} onChange={(e) => handlePeriodChange(e.target.value)}>
        {BUDGET_PERIODS.map(p => (
          <option key={p.value} value={p.value}>{t(`frequencies.${p.value}`)}</option>
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
      />
      <button type="submit">{initialValues ? t('common.save') : t('common.add')}</button>
      {onCancel && <button type="button" onClick={onCancel}>{t('common.cancel')}</button>}
      {error && <p className="auth-error">{error}</p>}
    </form>
  );
}

export default BudgetForm
