export function bucketGranularity(gte, lt) {
  const spanDays = (lt.getTime() - gte.getTime()) / (24 * 60 * 60 * 1000);
  if (spanDays <= 1) return 'hour';
  if (spanDays <= 31) return 'day';
  return 'month';
}

export function bucketKeyFor(date, granularity) {
  const d = new Date(date);
  if (granularity === 'hour') return `${String(d.getUTCHours()).padStart(2, '0')}:00`;
  if (granularity === 'day') return d.toISOString().slice(0, 10);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function generateBuckets(gte, lt, granularity) {
  const buckets = [];
  if (granularity === 'hour') {
    let cursor = new Date(gte);
    while (cursor < lt) {
      buckets.push({ key: bucketKeyFor(cursor, 'hour'), income: 0, expenses: 0 });
      cursor = new Date(cursor.getTime() + 60 * 60 * 1000);
    }
  } else if (granularity === 'day') {
    let cursor = new Date(Date.UTC(gte.getUTCFullYear(), gte.getUTCMonth(), gte.getUTCDate()));
    while (cursor < lt) {
      buckets.push({ key: bucketKeyFor(cursor, 'day'), income: 0, expenses: 0 });
      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    }
  } else {
    let cursor = new Date(Date.UTC(gte.getUTCFullYear(), gte.getUTCMonth(), 1));
    while (cursor < lt) {
      buckets.push({ key: bucketKeyFor(cursor, 'month'), income: 0, expenses: 0 });
      cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
    }
  }
  return buckets;
}
