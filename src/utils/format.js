import i18n from '../i18n/i18n.js'

// The app keeps every amount in one currency.
export const CURRENCY = 'USD';

// Follows the selected language, but always with Western digits so amounts
// read the same as the numbers typed into the forms.
function currentLocale() {
  return `${i18n.language || 'en'}-u-nu-latn`;
}

const formatters = new Map();

function cached(key, create) {
  if (!formatters.has(key)) formatters.set(key, create());
  return formatters.get(key);
}

export function formatCurrency(amount) {
  const locale = currentLocale();
  return cached(`currency:${locale}`, () => new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: CURRENCY,
    currencyDisplay: 'narrowSymbol',
  })).format(amount);
}

// For a chart's value axis, where there is no room for "$2,000.00": "$2K".
export function formatCurrencyCompact(amount) {
  const locale = currentLocale();
  return cached(`compact:${locale}`, () => new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: CURRENCY,
    currencyDisplay: 'narrowSymbol',
    notation: 'compact',
    maximumFractionDigits: 1,
  })).format(amount);
}

// A transaction's amount is stored unsigned; its type says which way it moved.
export function formatSignedCurrency(amount, type) {
  return `${type === 'income' ? '+' : '-'}${formatCurrency(amount)}`;
}

// For the calendar dates the API returns as midnight UTC (a transaction's
// date, a budget's start): read in UTC so the day never shifts with the
// viewer's time zone.
export function formatDate(value) {
  const locale = currentLocale();
  return cached(`date:${locale}`, () => new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  })).format(new Date(value));
}

// Axis label for a chart bucket as the API names it: a day ("2026-10-03"),
// a month ("2026-10") or an hour ("14:00", shown as it is).
export function formatBucketLabel(bucket) {
  const locale = currentLocale();
  if (/^\d{4}-\d{2}-\d{2}$/.test(bucket)) {
    return cached(`day:${locale}`, () => new Intl.DateTimeFormat(locale, {
      month: 'short', day: 'numeric', timeZone: 'UTC',
    })).format(new Date(bucket));
  }
  if (/^\d{4}-\d{2}$/.test(bucket)) {
    return cached(`month:${locale}`, () => new Intl.DateTimeFormat(locale, {
      month: 'short', year: 'numeric', timeZone: 'UTC',
    })).format(new Date(`${bucket}-01`));
  }
  return bucket;
}
