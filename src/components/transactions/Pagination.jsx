function Pagination({ page, totalPages, total, onPageChange }) {
  if (total === 0) return null;

  const safeTotalPages = Math.max(totalPages, 1);

  return (
    <div className="pagination">
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Prev</button>
      <span>Page {page} of {safeTotalPages} ({total} total)</span>
      <button type="button" disabled={page >= safeTotalPages} onClick={() => onPageChange(page + 1)}>Next</button>
    </div>
  );
}

export default Pagination
