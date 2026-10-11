import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BUDGET_CATEGORIES, BUDGET_PERIODS } from '../../constants/budgetCategories'
import { computePeriodDates } from '../../utils/budgetPeriod'
import Field from '../Field.jsx'
import { useSubmitGuard } from '../../hooks/useSubmitGuard.js'

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
  const saving = useSubmitGuard();

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
    if (!saving.begin()) return;
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
    } finally {
      saving.end();
    }
  };

  return (
    <form className="inline-form budget-form" onSubmit={handleSubmit}>
      <Field label={t('budgets.namePlaceholder')} wide>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </Field>
      <Field label={t('transactions.category')}>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {BUDGET_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
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
      <Field label={t('budgets.period')}>
        <select value={period} onChange={(e) => handlePeriodChange(e.target.value)}>
          {BUDGET_PERIODS.map(p => (
            <option key={p.value} value={p.value}>{t(`frequencies.${p.value}`)}</option>
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
      <Field label={t('common.endDate')}>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
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

export default BudgetForm
