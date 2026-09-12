export function parseDateRange({ start, end }) {
  if (!start || !end) return null;
  const gte = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);
  const lt = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
  return { gte, lt };
}
