import { useState } from 'react'
import { useTranslation } from 'react-i18next'

function SavingsGoalForm({ initialValues, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialValues?.name || '');
  const [targetAmount, setTargetAmount] = useState(initialValues?.targetAmount ?? '');
  const [savedAmount, setSavedAmount] = useState(initialValues?.savedAmount ?? 0);
  const [targetDate, setTargetDate] = useState(initialValues?.targetDate ? initialValues.targetDate.slice(0, 10) : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount || Number(targetAmount) <= 0) return;
    await onSubmit({
      name,
      targetAmount: Number(targetAmount),
      savedAmount: Number(savedAmount) || 0,
      targetDate: targetDate || null,
    });
    if (!initialValues) {
      setName('');
      setTargetAmount('');
      setSavedAmount(0);
      setTargetDate('');
    }
  };

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <input type="text" placeholder={t('goals.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
      <input type="number" placeholder={t('goals.targetAmountPlaceholder')} value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
      <input type="number" placeholder={t('goals.savedSoFarPlaceholder')} value={savedAmount} onChange={(e) => setSavedAmount(e.target.value)} />
      <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
      <button type="submit">{initialValues ? t('common.save') : t('common.add')}</button>
      {onCancel && <button type="button" onClick={onCancel}>{t('common.cancel')}</button>}
    </form>
  );
}

export default SavingsGoalForm
