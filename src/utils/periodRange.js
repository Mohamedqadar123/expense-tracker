function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPeriodRange(preset, customStart, customEnd) {
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

  if (preset === 'year') {
    const firstOfYear = new Date(today.getFullYear(), 0, 1);
    return { start: toDateString(firstOfYear), end };
  }

  if (preset === 'custom') {
    return { start: customStart || end, end: customEnd || end };
  }

  return { start: end, end };
}

const DAY_MS = 24 * 60 * 60 * 1000;

// The stretch of the same length that ends the day before `start`: for
// Oct 1 - Oct 11 (11 days) that is Sep 20 - Sep 30. Used to compare a period
// with the one before it, like for like.
export function getPreviousPeriodRange(start, end) {
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  const days = Math.round((endMs - startMs) / DAY_MS) + 1;
  const previousEnd = new Date(startMs - DAY_MS);
  const previousStart = new Date(startMs - days * DAY_MS);
  return {
    start: previousStart.toISOString().slice(0, 10),
    end: previousEnd.toISOString().slice(0, 10),
  };
}
