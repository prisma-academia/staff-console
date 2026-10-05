import numeral from 'numeral';
import { format, parseISO } from 'date-fns';

// Validated categorical order (light surface). Identity colours are assigned in
// this order and never cycled; a ninth category folds into "Other".
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];

// Ordinal blue ramp for ordered categories (funnel stages, age and GPA bands).
// Starts at step 250 so the lightest mark still clears 2:1 on white.
export const ORDINAL = ['#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95'];

/** Evenly samples `n` steps from the ordinal ramp, lightest first. */
export const ordinalSteps = (n) => {
  if (n <= 1) return [ORDINAL[4]];
  return Array.from({ length: n }, (_, i) => ORDINAL[Math.round((i * (ORDINAL.length - 1)) / (n - 1))]);
};

export const fNaira = (n) => `₦${numeral(n || 0).format('0,0')}`;

/** ₦1.2M / ₦850K for tiles where space is tight. */
export const fNairaShort = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) < 10000) return fNaira(v);
  return `₦${numeral(v).format('0.0a').replace('.0', '').toUpperCase()}`;
};

export const fCount = (n) => numeral(n || 0).format('0,0');

export const fPct = (n) => `${numeral(n || 0).format('0.[0]')}%`;

export const fMonth = (ym) => (ym ? format(parseISO(`${ym}-01`), 'MMM yy') : '');

/** Month label that flags the current, still-incomplete month. */
export const fMonthToDate = (ym) => (ym === format(new Date(), 'yyyy-MM') ? `${fMonth(ym)} (to date)` : fMonth(ym));

export const fDay = (ymd) => (ymd ? format(parseISO(ymd), 'd MMM') : '');

export const fDate = (d) => (d ? format(new Date(d), 'd MMM yyyy') : '—');

export const fDateTime = (d) => (d ? format(new Date(d), 'd MMM, HH:mm') : '—');

export const sum = (rows, key) => (rows || []).reduce((s, r) => s + (Number(r[key]) || 0), 0);

/** Object map -> [{ label, value }] sorted descending, with the tail past `max` folded into "Other". */
export const toSlices = (obj = {}, max = 6) => {
  const rows = Object.entries(obj)
    .map(([label, value]) => ({ label, value }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
  if (rows.length <= max) return rows;
  const head = rows.slice(0, max - 1);
  const rest = rows.slice(max - 1).reduce((s, r) => s + r.value, 0);
  return [...head, { label: 'Other', value: rest }];
};

/**
 * Fills missing days so a daily trend has an honest x axis, ending today.
 * `rows` carry a `date` key (yyyy-MM-dd).
 */
export const fillDays = (rows = [], days = 30, keys = ['count']) => {
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const out = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = format(d, 'yyyy-MM-dd');
    const row = byDate.get(key) || {};
    out.push(keys.reduce((acc, k) => ({ ...acc, [k]: row[k] || 0 }), { date: key }));
  }
  return out;
};

/** Fills missing months between the first row and the current month (rows carry `month` yyyy-MM). */
export const fillMonths = (rows = [], keys = ['count'], limit = 24) => {
  if (!rows.length) return [];
  const byMonth = new Map(rows.map((r) => [r.month, r]));
  const [y, m] = rows[0].month.split('-').map(Number);
  const cursor = new Date(y, m - 1, 1);
  const end = new Date();
  const out = [];
  while (cursor <= end) {
    const key = format(cursor, 'yyyy-MM');
    const row = byMonth.get(key) || {};
    out.push(keys.reduce((acc, k) => ({ ...acc, [k]: row[k] || 0 }), { month: key }));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out.slice(-limit);
};

/** Health tone from a rate against good/warning thresholds (higher is better). */
export const toneFor = (value, good, warn) => {
  if (value >= good) return 'good';
  if (value >= warn) return 'warning';
  return 'critical';
};
