/** Date helpers. Dates are stored as local calendar days in `YYYY-MM-DD` form. */

export type ISODate = string;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses `YYYY-MM-DD` as a local-time date at midnight. Returns null if invalid. */
export function parseISODate(value: string): Date | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  // Reject overflow such as 2027-02-31, which JS would silently roll into March.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function isValidISODate(value: unknown): value is ISODate {
  return typeof value === 'string' && parseISODate(value) !== null;
}

/** Formats a Date as a local `YYYY-MM-DD` string. */
export function toISODate(date: Date): ISODate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Whole calendar days from `now` to `target` (negative once the target has passed).
 * Compares calendar days, not elapsed hours, so 23:59 today -> tomorrow is 1.
 */
export function daysUntil(target: ISODate, now: Date = new Date()): number {
  const targetDate = parseISODate(target);
  if (!targetDate) return NaN;
  // Date.UTC removes daylight-saving shifts from the subtraction.
  const a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const b = Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  return Math.round((b - a) / 86_400_000);
}

export function formatLongDate(value: ISODate): string {
  const date = parseISODate(value);
  if (!date) return value;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Moves a date by a number of days (negative goes back). */
export function addDays(value: ISODate, days: number): ISODate {
  const date = parseISODate(value);
  if (!date) return value;
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Today as a local calendar day. */
export function todayISO(): ISODate {
  return toISODate(new Date());
}
