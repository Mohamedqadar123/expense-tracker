import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import '../App.css'
import { getTransactions, getTransactionAccounts, createTransaction, deleteTransaction } from '../api/transactions'
import { CATEGORIES } from '../constants/categories'
import { BUDGET_CATEGORIES } from '../constants/budgetCategories'
import TransactionFilters from '../components/TransactionFilters.jsx'
import Pagination from '../components/transactions/Pagination.jsx'

const DEFAULT_LIMIT = 25

function mergeCategories(a, b) {
  const seen = new Map();
  for (const cat of [...a, ...b]) {
    const key = cat.toLowerCase();
    if (!seen.has(key)) seen.set(key, cat);
  }
  return [...seen.values()];
}

function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("food");
  const [account, setAccount] = useState("");

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
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const loadAccounts = useCallback(() => {
    getTransactionAccounts().then(setAccounts).catch(() => {});
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getTransactions({
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
        if (res.data.length === 0 && filters.page > 1 && res.total > 0) {
          updateFilters({ page: filters.page - 1 });
        }
      })
      .catch(() => setError('Failed to load transactions'))
      .finally(() => setIsLoading(false));
  }, [filters, updateFilters]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount) return;

    await createTransaction({
      description,
      amount: Number(amount),
      type,
      category,
      account: account || undefined,
    });

    setDescription("");
    setAmount("");
    setType("expense");
    setCategory("food");
    setAccount("");
    load();
    loadAccounts();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    await deleteTransaction(id);
    load();
  };

  return (
    <div className="app">
      <h1>Finance Tracker</h1>
      <p className="subtitle">Track your income and expenses</p>

      <div className="add-transaction">
        <h2>Add Transaction</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Account (optional)"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>
      </div>

      <div className="transactions">
        <h2>Transactions</h2>

        <TransactionFilters
          filters={filters}
          onChange={updateFilters}
          categories={categories}
          accounts={accounts}
        />

        {error && (
          <div className="dashboard-error">
            <p>{error}</p>
            <button onClick={load}>Retry</button>
          </div>
        )}
        {isLoading ? (
          <p>Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="list-empty">No transactions match your filters.</p>
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Account</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td>{t.date.slice(0, 10)}</td>
                      <td>{t.description}</td>
                      <td>{t.category}</td>
                      <td>{t.account || '—'}</td>
                      <td className={t.type === "income" ? "income-amount" : "expense-amount"}>
                        {t.type === "income" ? "+" : "-"}${t.amount}
                      </td>
                      <td>
                        <button className="delete-btn" onClick={() => handleDelete(t.id)}>Delete</button>
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
