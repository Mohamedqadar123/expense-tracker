function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getReportPeriodRange(preset, customStart, customEnd) {
  const today = new Date();
  const end = toDateString(today);

  if (preset === 'today') {
    return { start: end, end };
  }

  if (preset === 'week') {
    const day = today.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);
    return { start: toDateString(monday), end };
  }

  if (preset === 'month') {
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: toDateString(firstOfMonth), end };
  }

  if (preset === 'lastMonth') {
    const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    return { start: toDateString(firstOfLastMonth), end: toDateString(lastOfLastMonth) };
  }

  if (preset === 'year') {
    const firstOfYear = new Date(today.getFullYear(), 0, 1);
    return { start: toDateString(firstOfYear), end };
  }

  if (preset === 'custom') {
    return { start: customStart || end, end: customEnd || end };
  }

  return { start: end, end };
}
