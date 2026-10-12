import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BUDGET_CATEGORIES, BUDGET_PERIODS } from '../../constants/budgetCategories'
import { computePeriodDates } from '../../utils/budgetPeriod'
import Field from '../Field.jsx'
import { useSubmitGuard } from '../../hooks/useSubmitGuard.js'

// Adds a budget, or edits one when `initialValues` is given. A budget is a
// spending limit for one category between two dates; choosing a period
// (weekly, monthly, yearly) fills the dates in for the current one, and they
// can still be changed.
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
  // What is wrong with each field, shown under it after a failed submit.
  const [fieldErrors, setFieldErrors] = useState({});
  const saving = useSubmitGuard();

  const handlePeriodChange = (nextPeriod) => {
    setPeriod(nextPeriod);
    const computed = computePeriodDates(nextPeriod);
    if (computed) {
      setStartDate(computed.start);
      setEndDate(computed.end);
      setFieldErrors((current) => ({ ...current, startDate: undefined, endDate: undefined }));
    }
  };

  // The same rules the API applies, checked first so each problem is
  // reported under its own field.
  const validate = () => {
    const problems = {};
    if (!name.trim()) problems.name = t('validation.nameRequired');
    if (!(Number(amount) > 0)) problems.amount = t('validation.amountPositive');
    if (!startDate) problems.startDate = t('validation.dateRequired');
    if (!endDate) problems.endDate = t('validation.dateRequired');
    else if (startDate && endDate <= startDate) problems.endDate = t('validation.endAfterStart');
    return problems;
  };

  const clearFieldError = (field) => {
    setFieldErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const problems = validate();
    setFieldErrors(problems);
    if (Object.keys(problems).length > 0) return;
    if (!saving.begin()) return;
    try {
      await onSubmit({ name: name.trim(), category, amount: Number(amount), period, startDate, endDate });
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
    // noValidate: the messages under the fields replace the browser's own bubbles
    <form className="inline-form budget-form" onSubmit={handleSubmit} noValidate>
      <Field label={t('budgets.namePlaceholder')} wide error={fieldErrors.name}>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); clearFieldError('name'); }}
          aria-invalid={Boolean(fieldErrors.name)}
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
      <Field label={t('budgets.period')}>
        <select value={period} onChange={(e) => handlePeriodChange(e.target.value)}>
          {BUDGET_PERIODS.map(p => (
            <option key={p.value} value={p.value}>{t(`frequencies.${p.value}`)}</option>
          ))}
        </select>
      </Field>
      <Field label={t('common.startDate')} error={fieldErrors.startDate}>
        <input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); clearFieldError('startDate'); clearFieldError('endDate'); }}
          aria-invalid={Boolean(fieldErrors.startDate)}
          required
        />
      </Field>
      <Field label={t('common.endDate')} error={fieldErrors.endDate}>
        <input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); clearFieldError('endDate'); }}
          aria-invalid={Boolean(fieldErrors.endDate)}
          required
        />
      </Field>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button type="submit" disabled={saving.isPending} aria-busy={saving.isPending}>
        {saving.isPending && <span className="button-spinner" aria-hidden="true" />}
        {saving.isPending ? t('common.saving') : initialValues ? t('common.save') : t('common.add')}
      </button>
      {onCancel && <button type="button" onClick={onCancel} disabled={saving.isPending}>{t('common.cancel')}</button>}
    </form>
  );
}

export default BudgetForm
