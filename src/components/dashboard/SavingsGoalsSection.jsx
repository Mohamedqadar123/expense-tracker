import { useState, useEffect } from 'react'
import { getGoals, createGoal, updateGoal, deleteGoal } from '../../api/goals'
import SavingsGoalForm from './SavingsGoalForm.jsx'

function SavingsGoalsSection() {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    getGoals()
      .then(setGoals)
      .catch(() => setError('Failed to load savings goals'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    getGoals()
      .then(setGoals)
      .catch(() => setError('Failed to load savings goals'))
      .finally(() => setIsLoading(false));
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
    if (!window.confirm('Delete this savings goal?')) return;
    await deleteGoal(id);
    load();
  };

  return (
    <div className="section-card">
      <h2>Savings Goals</h2>
      {isLoading ? (
        <p className="list-empty">Loading savings goals...</p>
      ) : error ? (
        <div className="dashboard-error">
          <p>{error}</p>
          <button onClick={load}>Retry</button>
        </div>
      ) : (
        <>
          {goals.length === 0 ? (
            <p className="list-empty">No savings goals yet — add one below.</p>
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
                        {g.targetDate && <p className="goal-target-date">Target: {g.targetDate.slice(0, 10)}</p>}
                        <div className="budget-actions">
                          <button onClick={() => setEditingId(g.id)}>Edit</button>
                          <button onClick={() => handleDelete(g.id)}>Delete</button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <h3 className="section-subheading">Add Savings Goal</h3>
          <SavingsGoalForm onSubmit={handleCreate} />
        </>
      )}
    </div>
  );
}

export default SavingsGoalsSection
