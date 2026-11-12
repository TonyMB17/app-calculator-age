const DAY_MS = 86_400_000;

// Ordinals represent civil dates, never local midnights.
export function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return null;
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null;
  return date.getTime() / DAY_MS;
}

export function toISO(ordinal) {
  return new Date(ordinal * DAY_MS).toISOString().slice(0, 10);
}

export function formatDate(ordinal) {
  return toISO(ordinal).split('-').reverse().join('/');
}

export function todayInLima(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type) => parts.find((p) => p.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function addMonths(ordinal, months) {
  const original = new Date(ordinal * DAY_MS);
  const target = new Date(ordinal * DAY_MS);
  target.setUTCDate(1);
  target.setUTCMonth(target.getUTCMonth() + months);
  const last = new Date(target.getTime());
  last.setUTCMonth(last.getUTCMonth() + 1);
  last.setUTCDate(0);
  target.setUTCDate(Math.min(original.getUTCDate(), last.getUTCDate()));
  return target.getTime() / DAY_MS;
}

export function calendarDifference(start, end) {
  if (end < start) throw new RangeError('La fecha final debe ser igual o posterior a la inicial.');
  const a = new Date(start * DAY_MS);
  const b = new Date(end * DAY_MS);
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth();
  if (addMonths(start, months) > end) months--;
  return {
    years: Math.floor(months / 12),
    months: months % 12,
    days: end - addMonths(start, months),
  };
}
