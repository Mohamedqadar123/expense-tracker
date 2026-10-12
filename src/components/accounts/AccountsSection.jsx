import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../../api/accounts'
import { getTransactions } from '../../api/transactions'
import AccountForm from './AccountForm.jsx'
import QuickAddTransactionForm from '../transactions/QuickAddTransactionForm.jsx'
import BottomSheet from '../BottomSheet.jsx'
import { CATEGORIES } from '../../constants/categories'
import { BUDGET_CATEGORIES } from '../../constants/budgetCategories'
import { mergeCategories } from '../../utils/mergeCategories'
import { getAccountType } from '../../utils/accountType'
import { formatCurrency, formatSignedCurrency, formatDate, CURRENCY } from '../../utils/format'
import { useFeedback } from '../../context/useFeedback.js'
import { ListSkeleton } from '../feedback/Skeleton.jsx'
import EmptyState from '../feedback/EmptyState.jsx'
import { PlusIcon, BankIcon, PhoneIcon, CashIcon, CardIcon } from '../icons/Icons.jsx'
import { loadErrorMessage } from '../../api/config'

const categories = mergeCategories(CATEGORIES, BUDGET_CATEGORIES);

const RECENT_PER_ACCOUNT = 3;

const TYPE_ICONS = {
  bank: <BankIcon />,
  mobileMoney: <PhoneIcon />,
  cash: <CashIcon />,
  other: <CardIcon />,
};

const TYPE_LABELS = {
  bank: 'accounts.typeBank',
  mobileMoney: 'accounts.typeMobileMoney',
  cash: 'accounts.typeCash',
  other: 'accounts.typeOther',
};

// The whole Accounts page: the total, one card per account, and the dialogs
// for adding or editing an account and for moving money in or out of one.
//
// Every figure comes from the API. An account's balance is worked out there
// as its starting balance plus everything credited to it minus everything
// debited from it, so it always follows the transactions.
function AccountsSection() {
  const { t } = useTranslation();
  const { confirm, notify } = useFeedback();
  const [accounts, setAccounts] = useState([]);
  // Latest transactions of each account, by account id. Missing until loaded.
  const [recent, setRecent] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Why an action was refused (e.g. deleting an account that has
  // transactions). Shown above the cards, which stay where they are.
  const [actionError, setActionError] = useState(null);
  // The open dialog: { kind: 'add' }, { kind: 'edit', account } or
  // { kind: 'move', account, type } ('income' credits, 'expense' debits).
  const [dialog, setDialog] = useState(null);

  const load = useCallback(() => {
    return getAccounts()
      .then((list) => {
        setAccounts(list);
        setError(null);
        return Promise.all(list.map((account) =>
          getTransactions({ account: account.name, limit: RECENT_PER_ACCOUNT })
            .then((page) => [account.id, page.data])
            // An account's activity is an extra: without it the card still stands.
            .catch(() => [account.id, null])
        ));
      })
      .then((entries) => setRecent(Object.fromEntries(entries)))
      .catch((err) => setError(loadErrorMessage(err, t('accounts.loadError'))))
      .finally(() => setIsLoading(false));
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  // A transaction added from anywhere changes an account's balance.
  useEffect(() => {
    window.addEventListener('transaction:created', load);
    return () => window.removeEventListener('transaction:created', load);
  }, [load]);

  const retry = () => {
    setIsLoading(true);
    load();
  };

  const closeDialog = () => setDialog(null);

  const handleCreate = async (data) => {
    await createAccount(data);
    closeDialog();
    load();
    notify(t('feedback.added'));
  };

  const handleUpdate = async (id, data) => {
    await updateAccount(id, data);
    closeDialog();
    load();
    notify(t('feedback.saved'));
  };

  const handleDelete = async (id) => {
    if (!(await confirm(t('accounts.deleteConfirm'), t('common.delete')))) return;
    setActionError(null);
    try {
      await deleteAccount(id);
      load();
      notify(t('feedback.deleted'));
    } catch (err) {
      setActionError(err.message);
    }
  };

  // One currency for the whole app, so the balances can simply be added.
  const total = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('accounts.title')}</h1>
          <p className="subtitle">{t('accounts.subtitle')}</p>
        </div>
        <button type="button" className="btn btn-primary accounts-add-button" onClick={() => setDialog({ kind: 'add' })}>
          <PlusIcon />
          {t('accounts.addAccount')}
        </button>
      </div>

      {isLoading ? (
        <div className="section-card"><ListSkeleton label={t('accounts.loading')} /></div>
      ) : error ? (
        <div className="dashboard-error">
          <p>{error}</p>
          <button onClick={retry}>{t('common.retry')}</button>
        </div>
      ) : accounts.length === 0 ? (
        <div className="section-card">
          <EmptyState icon="wallet" message={t('accounts.empty')} />
        </div>
      ) : (
        <>
          <div className="card accounts-total">
            <span className="accounts-total-label">{t('accounts.totalBalance')}</span>
            <strong className={`accounts-total-value ${total < 0 ? 'expense-amount' : ''}`}>{formatCurrency(total)}</strong>
            <span className="account-currency">{CURRENCY}</span>
          </div>

          {actionError && <p className="auth-error" role="alert">{actionError}</p>}

          <ul className="accounts-grid">
            {accounts.map((account) => {
              const type = getAccountType(account.name);
              const activity = recent[account.id];
              return (
                <li key={account.id} className="card account-card">
                  <div className="account-card-header">
                    <span className={`account-icon account-icon-${type}`} aria-hidden="true">{TYPE_ICONS[type]}</span>
                    <div className="account-card-title">
                      <h2>{account.name}</h2>
                      <p className="account-type">{t(TYPE_LABELS[type])}</p>
                    </div>
                    <span className="account-currency">{CURRENCY}</span>
                  </div>

                  <p className={`account-balance ${account.balance < 0 ? 'expense-amount' : ''}`}>
                    {formatCurrency(account.balance)}
                  </p>
                  <p className="account-breakdown">
                    <span>{t('accounts.startingBalance', { amount: formatCurrency(account.startingBalance) })}</span>
                    <span>{t('accounts.moneyIn', { amount: formatCurrency(account.income ?? 0) })}</span>
                    <span>{t('accounts.moneyOut', { amount: formatCurrency(account.expense ?? 0) })}</span>
                  </p>

                  <div className="account-activity">
                    <h3>{t('accounts.recentActivity')}</h3>
                    {activity && activity.length > 0 ? (
                      <ul>
                        {activity.map((tx) => (
                          <li key={tx.id}>
                            <span className="account-activity-description">{tx.description}</span>
                            <span className="account-activity-date">{formatDate(tx.date)}</span>
                            <span className={tx.type === 'income' ? 'income-amount' : 'expense-amount'}>
                              {formatSignedCurrency(tx.amount, tx.type)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : activity ? (
                      <p className="account-activity-empty">{t('accounts.noActivity')}</p>
                    ) : null}
                  </div>

                  <div className="account-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDialog({ kind: 'move', account, type: 'income' })}>
                      {t('common.credit')}
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDialog({ kind: 'move', account, type: 'expense' })}>
                      {t('common.debit')}
                    </button>
                    <Link to={`/transactions?account=${encodeURIComponent(account.name)}`} className="btn btn-ghost btn-sm">
                      {t('accounts.viewTransactions')}
                    </Link>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDialog({ kind: 'edit', account })}>
                      {t('common.edit')}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm account-delete" onClick={() => handleDelete(account.id)}>
                      {t('common.delete')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <BottomSheet isOpen={dialog?.kind === 'add'} onClose={closeDialog} title={t('accounts.addAccount')}>
        <AccountForm onSubmit={handleCreate} onCancel={closeDialog} />
      </BottomSheet>

      <BottomSheet isOpen={dialog?.kind === 'edit'} onClose={closeDialog} title={t('accounts.editAccount')}>
        {dialog?.kind === 'edit' && (
          <AccountForm
            key={dialog.account.id}
            initialValues={dialog.account}
            onSubmit={(data) => handleUpdate(dialog.account.id, data)}
            onCancel={closeDialog}
          />
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={dialog?.kind === 'move'}
        onClose={closeDialog}
        title={dialog?.kind === 'move' ? `${dialog.type === 'income' ? t('common.credit') : t('common.debit')}: ${dialog.account.name}` : ''}
      >
        {dialog?.kind === 'move' && (
          <QuickAddTransactionForm
            key={`${dialog.account.id}-${dialog.type}`}
            categories={categories}
            defaultAccount={dialog.account.name}
            defaultType={dialog.type}
            // The listener above reloads the cards when the form announces what it saved
            onSuccess={() => { closeDialog(); notify(t('feedback.added')); }}
            onCancel={closeDialog}
          />
        )}
      </BottomSheet>
    </>
  );
}

export default AccountsSection
