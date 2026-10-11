import i18n from '../i18n/i18n.js'

// The app keeps every amount in one currency.
const CURRENCY = 'USD';

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
