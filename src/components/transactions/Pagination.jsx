import { useTranslation } from 'react-i18next'

function Pagination({ page, totalPages, total, onPageChange }) {
  const { t } = useTranslation();
  if (total === 0) return null;

  const safeTotalPages = Math.max(totalPages, 1);

  return (
    <div className="pagination">
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>{t('transactions.prev')}</button>
      <span>{t('transactions.pageOf', { page, totalPages: safeTotalPages, total })}</span>
      <button type="button" disabled={page >= safeTotalPages} onClick={() => onPageChange(page + 1)}>{t('transactions.next')}</button>
    </div>
  );
}

export default Pagination
