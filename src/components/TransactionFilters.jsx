import { useState, useEffect } from 'react'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'amount_desc', label: 'Highest amount' },
  { value: 'amount_asc', label: 'Lowest amount' },
]

const DEBOUNCE_MS = 350

function useDebouncedCommit(value, onCommit) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onCommit(draft), DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return [draft, setDraft];
}

function TransactionFilters({ filters, onChange, categories, accounts }) {
  const [searchDraft, setSearchDraft] = useDebouncedCommit(filters.search, (v) => onChange({ search: v }));
  const [minDraft, setMinDraft] = useDebouncedCommit(filters.minAmount, (v) => onChange({ minAmount: v }));
  const [maxDraft, setMaxDraft] = useDebouncedCommit(filters.maxAmount, (v) => onChange({ maxAmount: v }));

  const handleClear = () => onChange({
    search: '',
    type: 'all',
    category: 'all',
    account: 'all',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    sort: 'newest',
  });

  return (
    <div className="transaction-filters">
      <input
        type="text"
        placeholder="Search description..."
        value={searchDraft}
        onChange={(e) => setSearchDraft(e.target.value)}
      />
      <select value={filters.type} onChange={(e) => onChange({ type: e.target.value })}>
        <option value="all">All Types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
      <select value={filters.category} onChange={(e) => onChange({ category: e.target.value })}>
        <option value="all">All Categories</option>
        {categories.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select value={filters.account} onChange={(e) => onChange({ account: e.target.value })}>
        <option value="all">All Accounts</option>
        {accounts.map(a => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
      <div className="filter-date-range">
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => onChange({ startDate: e.target.value })}
        />
        <span>to</span>
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => onChange({ endDate: e.target.value })}
        />
      </div>
      <div className="filter-amount-range">
        <input
          type="number"
          placeholder="Min $"
          value={minDraft}
          onChange={(e) => setMinDraft(e.target.value)}
        />
        <span>to</span>
        <input
          type="number"
          placeholder="Max $"
          value={maxDraft}
          onChange={(e) => setMaxDraft(e.target.value)}
        />
      </div>
      <select value={filters.sort} onChange={(e) => onChange({ sort: e.target.value })}>
        {SORT_OPTIONS.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <button type="button" className="clear-filters-btn" onClick={handleClear}>Clear filters</button>
    </div>
  );
}

export default TransactionFilters
