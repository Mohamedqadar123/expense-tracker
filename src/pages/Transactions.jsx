import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import '../styles/shared.css'
import '../App.css'
import './Transactions.css'
import { getTransactions, getTransactionAccounts, updateTransaction, deleteTransaction } from '../api/transactions'
import { CATEGORIES } from '../constants/categories'
import { BUDGET_CATEGORIES } from '../constants/budgetCategories'
import { mergeCategories } from '../utils/mergeCategories'
import TransactionFilters from '../components/TransactionFilters.jsx'
import Pagination from '../components/transactions/Pagination.jsx'
import QuickAddTransactionForm from '../components/transactions/QuickAddTransactionForm.jsx'
import BottomSheet from '../components/BottomSheet.jsx'
import { formatSignedCurrency, formatDate } from '../utils/format'
import { useFeedback } from '../context/useFeedback.js'
import { ListSkeleton } from '../components/feedback/Skeleton.jsx'
import EmptyState from '../components/feedback/EmptyState.jsx'
import { PlusIcon } from '../components/icons/Icons.jsx'
import { loadErrorMessage } from '../api/config'

const DEFAULT_LIMIT = 25

// The add-transaction form belongs to the app shell (Layout), which opens it
// when it hears this, and announces what it saved with `transaction:created`.
function openQuickAdd() {
  window.dispatchEvent(new CustomEvent('quick-add:open'));
}

function Transactions() {
  const { t } = useTranslation();
  const { confirm, notify } = useFeedback();
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  // The transaction open in the edit dialog, or null.
  const [editing, setEditing] = useState(null);
  // Phones only: the filters are folded away until asked for.
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const categories = mergeCategories(CATEGORIES, BUDGET_CATEGORIES);

  const filters = useMemo(() => ({
    search: searchParams.get('search') || '',
    type: searchParams.get('type') || 'all',
    category: searchParams.get('category') || 'all',
    account: searchParams.get('account') || 'all',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    minAmount: searchParams.get('minAmount') || '',
    maxAmount: searchParams.get('maxAmount') || '',
    sort: searchParams.get('sort') || 'newest',
    page: Number(searchParams.get('page')) || 1,
  }), [searchParams]);

  // How many filters are narrowing the list (sorting and paging don't).
  const activeFilterCount = [
    filters.search, filters.type !== 'all', filters.category !== 'all', filters.account !== 'all',
    filters.startDate, filters.endDate, filters.minAmount, filters.maxAmount,
  ].filter(Boolean).length;

  const updateFilters = useCallback((partial) => {
    const next = new URLSearchParams(searchParams);
    const isPageOnly = Object.keys(partial).length === 1 && 'page' in partial;
    Object.entries(partial).forEach(([k, v]) => {
      if (v === '' || v === 'all' || v === undefined || v === null) next.delete(k);
      else next.set(k, v);
    });
    if (!isPageOnly) next.delete('page');
    setIsLoading(true);
    setError(null);
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const clearFilters = () => updateFilters({
    search: '', type: 'all', category: 'all', account: 'all',
    startDate: '', endDate: '', minAmount: '', maxAmount: '',
  });

  const loadAccounts = useCallback(() => {
    // Only fills in the account filter; the list itself reports its own failures
    getTransactionAccounts().then(setAccounts).catch(console.error);
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const fetchTransactions = useCallback(() => {
    return getTransactions({
      search: filters.search,
      type: filters.type !== 'all' ? filters.type : undefined,
      category: filters.category !== 'all' ? filters.category : undefined,
      account: filters.account !== 'all' ? filters.account : undefined,
      startDate: filters.startDate,
      endDate: filters.endDate,
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount,
      sort: filters.sort,
      page: filters.page,
      limit: DEFAULT_LIMIT,
    })
      .then(res => {
        setTransactions(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setError(null);
        if (res.data.length === 0 && filters.page > 1 && res.total > 0) {
          updateFilters({ page: filters.page - 1 });
        }
      })
      .catch((err) => setError(loadErrorMessage(err, t('transactions.loadError'))))
      .finally(() => setIsLoading(false));
  }, [filters, updateFilters, t]);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    return fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    const handleCreated = () => { load(); loadAccounts(); };
    window.addEventListener('transaction:created', handleCreated);
    return () => window.removeEventListener('transaction:created', handleCreated);
  }, [load, loadAccounts]);

  const handleDelete = async (id) => {
    if (!(await confirm(t('transactions.deleteConfirm'), t('common.delete')))) return;
    try {
      await deleteTransaction(id);
      load();
      loadAccounts();
      notify(t('feedback.deleted'));
    } catch (err) {
      setError(err.message);
    }
  };

  // Throws when the server refuses the change (e.g. a debit the account
  // cannot cover), which the form shows without closing.
  const handleUpdate = async (id, data) => {
    await updateTransaction(id, data);
    setEditing(null);
    load();
    loadAccounts();
    notify(t('feedback.saved'));
  };

  return (
    <div className="transactions-page">
      <div className="page-header">
        <div>
          <h1>{t('transactions.heading')}</h1>
          <p className="subtitle">{t('transactions.subtitle')}</p>
        </div>
        <button type="button" className="btn btn-primary page-header-action" onClick={openQuickAdd}>
          <PlusIcon />
          {t('transactions.addTransaction')}
        </button>
      </div>

      <div className="section-card transactions-card">
        <button
          type="button"
          className="btn btn-secondary btn-sm filters-toggle"
          aria-expanded={isFiltersOpen}
          onClick={() => setIsFiltersOpen((open) => !open)}
        >
          {t('transactions.filters')}
          {activeFilterCount > 0 && <span className="filters-count">{activeFilterCount}</span>}
        </button>
        <div className={`filters-panel ${isFiltersOpen ? 'filters-panel-open' : ''}`}>
          <TransactionFilters
            filters={filters}
            onChange={updateFilters}
            categories={categories}
            accounts={accounts}
          />
        </div>

        {error && (
          <div className="dashboard-error">
            <p>{error}</p>
            <button onClick={load}>{t('common.retry')}</button>
          </div>
        )}
        {isLoading ? (
          <ListSkeleton label={t('transactions.loading')} rows={5} />
        ) : error && transactions.length === 0 ? null : transactions.length === 0 ? (
          activeFilterCount > 0 ? (
            <EmptyState icon="chart" message={t('transactions.noMatch')}>
              <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                {t('transactions.clearFilters')}
              </button>
            </EmptyState>
          ) : (
            <EmptyState icon="chart" title={t('transactions.emptyTitle')} message={t('transactions.emptyBody')}>
              <button type="button" className="btn btn-primary" onClick={openQuickAdd}>
                <PlusIcon />
                {t('transactions.addTransaction')}
              </button>
            </EmptyState>
          )
        ) : (
          <>
            <div className="table-scroll">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>{t('transactions.date')}</th>
                    <th>{t('transactions.description')}</th>
                    <th>{t('transactions.category')}</th>
                    <th>{t('transactions.account')}</th>
                    <th>{t('reports.type')}</th>
                    <th className="amount-cell">{t('transactions.amount')}</th>
                    <th className="table-actions">{t('transactions.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id}>
                      <td data-label={t('transactions.date')}>{formatDate(tx.date)}</td>
                      <td data-label={t('transactions.description')} className="description-cell">{tx.description}</td>
                      <td data-label={t('transactions.category')} className="category-cell">{tx.category}</td>
                      <td data-label={t('transactions.account')}>{tx.account || '—'}</td>
                      <td data-label={t('reports.type')}>
                        <span className={`type-badge type-badge-${tx.type}`}>
                          {tx.type === 'income' ? t('common.income') : t('common.expense')}
                        </span>
                      </td>
                      <td
                        data-label={t('transactions.amount')}
                        className={`amount-cell ${tx.type === 'income' ? 'income-amount' : 'expense-amount'}`}
                      >
                        {formatSignedCurrency(tx.amount, tx.type)}
                      </td>
                      <td className="table-actions">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(tx)}>
                          {t('common.edit')}
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm row-delete" onClick={() => handleDelete(tx.id)}>
                          {t('common.delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={filters.page}
              totalPages={totalPages}
              total={total}
              onPageChange={(p) => updateFilters({ page: p })}
            />
          </>
        )}
      </div>

      <BottomSheet isOpen={Boolean(editing)} onClose={() => setEditing(null)} title={t('transactions.editTransaction')}>
        {editing && (
          <QuickAddTransactionForm
            key={editing.id}
            categories={categories}
            initialValues={editing}
            onSubmit={(data) => handleUpdate(editing.id, data)}
            onCancel={() => setEditing(null)}
          />
        )}
      </BottomSheet>
    </div>
  );
}

export default Transactions
