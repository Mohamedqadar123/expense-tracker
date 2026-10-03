import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../../api/accounts'
import AccountForm from './AccountForm.jsx'

function AccountsSection() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    getAccounts()
      .then(setAccounts)
      .catch(() => setError(t('accounts.loadError')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (data) => {
    await createAccount(data);
    load();
  };

  const handleUpdate = async (id, data) => {
    await updateAccount(id, data);
    setEditingId(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('accounts.deleteConfirm'))) return;
    try {
      await deleteAccount(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="section-card">
      <h2>{t('accounts.heading')}</h2>
      {isLoading ? (
        <p className="list-empty">{t('accounts.loading')}</p>
      ) : error ? (
        <div className="dashboard-error">
          <p>{error}</p>
          <button onClick={load}>{t('common.retry')}</button>
        </div>
      ) : (
        <>
          {accounts.length === 0 ? (
            <p className="list-empty">{t('accounts.empty')}</p>
          ) : (
            <ul className="account-list">
              {accounts.map(a => (
                <li key={a.id}>
                  {editingId === a.id ? (
                    <AccountForm
                      initialValues={a}
                      onSubmit={(data) => handleUpdate(a.id, data)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <div className="budget-row-header">
                        <span className="budget-category">{a.name}</span>
                        <span className={a.balance >= 0 ? 'income-amount' : 'expense-amount'}>
                          ${a.balance.toFixed(2)}
                        </span>
                      </div>
                      <div className="budget-meta">
                        {t('accounts.startingBalance', { amount: a.startingBalance.toFixed(2) })}
                      </div>
                      <div className="budget-actions">
                        <button onClick={() => setEditingId(a.id)}>{t('common.edit')}</button>
                        <button onClick={() => handleDelete(a.id)}>{t('common.delete')}</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          <h3 className="section-subheading">{t('accounts.addAccount')}</h3>
          <AccountForm onSubmit={handleCreate} />
        </>
      )}
    </div>
  );
}

export default AccountsSection
