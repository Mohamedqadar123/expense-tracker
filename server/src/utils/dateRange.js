export function parseDateRange({ start, end }) {
  if (!start || !end) return null;
  const gte = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);
  const lt = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
  return { gte, lt };
}

// Like parseDateRange, but supports a one-sided range (only startDate or only
// endDate) rather than requiring both.
export function parsePartialDateRange({ startDate, endDate } = {}) {
  const range = {};

  if (startDate) {
    const gte = new Date(`${startDate}T00:00:00.000Z`);
    if (isNaN(gte)) return { error: 'startDate must be a valid date (YYYY-MM-DD)' };
    range.gte = gte;
  }

  if (endDate) {
    const end = new Date(`${endDate}T00:00:00.000Z`);
    if (isNaN(end)) return { error: 'endDate must be a valid date (YYYY-MM-DD)' };
    range.lt = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }

  if (range.gte && range.lt && range.gte >= range.lt) {
    return { error: 'startDate must be before or equal to endDate' };
  }

  return { range: Object.keys(range).length ? range : null };
}
