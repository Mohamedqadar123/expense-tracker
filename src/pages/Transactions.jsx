import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import '../styles/shared.css'
import '../App.css'
import { getTransactions, getTransactionAccounts, deleteTransaction } from '../api/transactions'
import { CATEGORIES } from '../constants/categories'
import { BUDGET_CATEGORIES } from '../constants/budgetCategories'
import { mergeCategories } from '../utils/mergeCategories'
import TransactionFilters from '../components/TransactionFilters.jsx'
import Pagination from '../components/transactions/Pagination.jsx'
import QuickAddTransactionForm from '../components/transactions/QuickAddTransactionForm.jsx'

const DEFAULT_LIMIT = 25

function Transactions() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);

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

  const loadAccounts = useCallback(() => {
    getTransactionAccounts().then(setAccounts).catch(() => {});
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
      .catch(() => setError(t('transactions.loadError')))
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
    if (!window.confirm(t('transactions.deleteConfirm'))) return;
    await deleteTransaction(id);
    load();
  };

  return (
    <div className="app">
      <h1>{t('transactions.brand')}</h1>
      <p className="subtitle">{t('transactions.subtitle')}</p>

      <div className="add-transaction">
        <h2>{t('transactions.addTransaction')}</h2>
        <QuickAddTransactionForm
          categories={categories}
          onSuccess={() => { load(); loadAccounts(); }}
          broadcast={false}
        />
      </div>

      <div className="transactions">
        <h2>{t('transactions.heading')}</h2>

        <TransactionFilters
          filters={filters}
          onChange={updateFilters}
          categories={categories}
          accounts={accounts}
        />

        {error && (
          <div className="dashboard-error">
            <p>{error}</p>
            <button onClick={load}>{t('common.retry')}</button>
          </div>
        )}
        {isLoading ? (
          <p>{t('transactions.loading')}</p>
        ) : transactions.length === 0 ? (
          <p className="list-empty">{t('transactions.noMatch')}</p>
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{t('transactions.date')}</th>
                    <th>{t('transactions.description')}</th>
                    <th>{t('transactions.category')}</th>
                    <th>{t('transactions.account')}</th>
                    <th>{t('transactions.amount')}</th>
                    <th>{t('transactions.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id}>
                      <td data-label={t('transactions.date')}>{tx.date.slice(0, 10)}</td>
                      <td data-label={t('transactions.description')}>{tx.description}</td>
                      <td data-label={t('transactions.category')}>{tx.category}</td>
                      <td data-label={t('transactions.account')}>{tx.account || '—'}</td>
                      <td data-label={t('transactions.amount')} className={tx.type === "income" ? "income-amount" : "expense-amount"}>
                        {tx.type === "income" ? "+" : "-"}${tx.amount}
                      </td>
                      <td data-label={t('transactions.actions')}>
                        <button className="delete-btn" onClick={() => handleDelete(tx.id)}>{t('common.delete')}</button>
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
    </div>
  );
}

export default Transactions
