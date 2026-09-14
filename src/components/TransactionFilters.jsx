import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation();
  const [searchDraft, setSearchDraft] = useDebouncedCommit(filters.search, (v) => onChange({ search: v }));
  const [minDraft, setMinDraft] = useDebouncedCommit(filters.minAmount, (v) => onChange({ minAmount: v }));
  const [maxDraft, setMaxDraft] = useDebouncedCommit(filters.maxAmount, (v) => onChange({ maxAmount: v }));

  const SORT_OPTIONS = [
    { value: 'newest', label: t('transactions.sortNewest') },
    { value: 'oldest', label: t('transactions.sortOldest') },
    { value: 'amount_desc', label: t('transactions.sortAmountDesc') },
    { value: 'amount_asc', label: t('transactions.sortAmountAsc') },
  ]

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
        placeholder={t('transactions.searchPlaceholder')}
        value={searchDraft}
        onChange={(e) => setSearchDraft(e.target.value)}
      />
      <select value={filters.type} onChange={(e) => onChange({ type: e.target.value })}>
        <option value="all">{t('transactions.allTypes')}</option>
        <option value="income">{t('common.income')}</option>
        <option value="expense">{t('common.expense')}</option>
      </select>
      <select value={filters.category} onChange={(e) => onChange({ category: e.target.value })}>
        <option value="all">{t('transactions.allCategories')}</option>
        {categories.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select value={filters.account} onChange={(e) => onChange({ account: e.target.value })}>
        <option value="all">{t('transactions.allAccounts')}</option>
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
        <span>{t('common.to')}</span>
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => onChange({ endDate: e.target.value })}
        />
      </div>
      <div className="filter-amount-range">
        <input
          type="number"
          placeholder={t('transactions.minAmountPlaceholder')}
          value={minDraft}
          onChange={(e) => setMinDraft(e.target.value)}
        />
        <span>{t('common.to')}</span>
        <input
          type="number"
          placeholder={t('transactions.maxAmountPlaceholder')}
          value={maxDraft}
          onChange={(e) => setMaxDraft(e.target.value)}
        />
      </div>
      <select value={filters.sort} onChange={(e) => onChange({ sort: e.target.value })}>
        {SORT_OPTIONS.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <button type="button" className="clear-filters-btn" onClick={handleClear}>{t('transactions.clearFilters')}</button>
    </div>
  );
}

export default TransactionFilters
