/**
 * A forgiving streak.
 * - Any studied day counts, including a 5-minute minimum day.
 * - One missed day per calendar week (Monday to Sunday) is a free rest day.
 * - Today never breaks the streak while it is still in progress.
 */
import { addDays, daysUntil, parseISODate, toISODate, type ISODate } from './date';

export interface StreakInfo {
  /** Studied days in the current streak. */
  current: number;
  studiedToday: boolean;
  /** Free rest days used inside the current streak. */
  restDaysUsed: number;
  /** Whole days since the last studied day before today, or null if there is none. */
  daysSinceLast: number | null;
  /** True after 3 or more missed days in a row: show "welcome back" and a lighter day. */
  comeback: boolean;
}

/** The Monday of the week a date falls in. */
export function weekStart(date: ISODate): ISODate {
  const d = parseISODate(date)!;
  const daysFromMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - daysFromMonday);
  return toISODate(d);
}

export function computeStreak(studied: Iterable<ISODate>, today: ISODate): StreakInfo {
  const days = new Set(studied);
  const sorted = [...days].sort();
  const earliest = sorted[0];
  const studiedToday = days.has(today);

  const lastBefore = sorted.filter((d) => d < today).pop();
  const daysSinceLast = lastBefore ? daysUntil(today, parseISODate(lastBefore)!) : null;

  let current = 0;
  let restDaysUsed = 0;
  const restWeeks = new Set<ISODate>();
  // Walk backwards from today (or yesterday, if today has not been studied yet).
  let cursor = studiedToday ? today : addDays(today, -1);
  let pendingRest = 0; // rest days seen since the last studied day
  while (earliest && cursor >= earliest) {
    if (days.has(cursor)) {
      current++;
      restDaysUsed += pendingRest;
      pendingRest = 0;
    } else {
      const week = weekStart(cursor);
      if (restWeeks.has(week)) break; // second missed day in the same week
      restWeeks.add(week);
      pendingRest++;
    }
    cursor = addDays(cursor, -1);
  }

  return {
    current,
    studiedToday,
    restDaysUsed,
    daysSinceLast,
    comeback: daysSinceLast !== null && daysSinceLast >= 4,
  };
}
