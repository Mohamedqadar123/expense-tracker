import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getGoals, createGoal, updateGoal, deleteGoal } from '../../api/goals'
import SavingsGoalForm from './SavingsGoalForm.jsx'
import { formatCurrency, formatDate } from '../../utils/format'
import { useFeedback } from '../../context/useFeedback.js'
import { ListSkeleton } from '../feedback/Skeleton.jsx'
import EmptyState from '../feedback/EmptyState.jsx'

function SavingsGoalsSection() {
  const { t } = useTranslation();
  const { confirm, notify } = useFeedback();
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    getGoals()
      .then(setGoals)
      .catch(() => setError(t('goals.loadError')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    getGoals()
      .then(setGoals)
      .catch(() => setError(t('goals.loadError')))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (data) => {
    await createGoal(data);
    load();
    notify(t('feedback.added'));
  };

  const handleUpdate = async (id, data) => {
    await updateGoal(id, data);
    setEditingId(null);
    load();
    notify(t('feedback.saved'));
  };

  const handleDelete = async (id) => {
    if (!(await confirm(t('goals.deleteConfirm'), t('common.delete')))) return;
    try {
      await deleteGoal(id);
      load();
      notify(t('feedback.deleted'));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="section-card">
      <h2>{t('goals.heading')}</h2>
      {isLoading ? (
        <ListSkeleton label={t('goals.loading')} />
      ) : error ? (
        <div className="dashboard-error">
          <p>{error}</p>
          <button onClick={load}>{t('common.retry')}</button>
        </div>
      ) : (
        <>
          {goals.length === 0 ? (
            <EmptyState icon="target" message={t('goals.empty')} />
          ) : (
            <ul className="goal-list">
              {goals.map(g => {
                const percent = g.targetAmount > 0 ? Math.min((g.savedAmount / g.targetAmount) * 100, 100) : 0;
                return (
                  <li key={g.id}>
                    {editingId === g.id ? (
                      <SavingsGoalForm
                        initialValues={g}
                        onSubmit={(data) => handleUpdate(g.id, data)}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <>
                        <div className="budget-row-header">
                          <span className="budget-category">{g.name}</span>
                          <span>{formatCurrency(g.savedAmount)} / {formatCurrency(g.targetAmount)}</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
                        </div>
                        {g.targetDate && <p className="goal-target-date">{t('goals.target', { date: formatDate(g.targetDate) })}</p>}
                        <div className="budget-actions">
                          <button onClick={() => setEditingId(g.id)}>{t('common.edit')}</button>
                          <button onClick={() => handleDelete(g.id)}>{t('common.delete')}</button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <h3 className="section-subheading">{t('goals.addGoal')}</h3>
          <SavingsGoalForm onSubmit={handleCreate} />
        </>
      )}
    </div>
  );
}

export default SavingsGoalsSection
