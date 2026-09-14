import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getGoals, createGoal, updateGoal, deleteGoal } from '../../api/goals'
import SavingsGoalForm from './SavingsGoalForm.jsx'

function SavingsGoalsSection() {
  const { t } = useTranslation();
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
  };

  const handleUpdate = async (id, data) => {
    await updateGoal(id, data);
    setEditingId(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('goals.deleteConfirm'))) return;
    await deleteGoal(id);
    load();
  };

  return (
    <div className="section-card">
      <h2>{t('goals.heading')}</h2>
      {isLoading ? (
        <p className="list-empty">{t('goals.loading')}</p>
      ) : error ? (
        <div className="dashboard-error">
          <p>{error}</p>
          <button onClick={load}>{t('common.retry')}</button>
        </div>
      ) : (
        <>
          {goals.length === 0 ? (
            <p className="list-empty">{t('goals.empty')}</p>
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
                          <span>${g.savedAmount.toFixed(2)} / ${g.targetAmount.toFixed(2)}</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
                        </div>
                        {g.targetDate && <p className="goal-target-date">{t('goals.target', { date: g.targetDate.slice(0, 10) })}</p>}
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
