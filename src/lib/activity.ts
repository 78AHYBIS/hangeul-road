/** A small log of what was studied each day. Feeds the streak, weekly review and progress. */
import { isValidISODate, type ISODate } from './date';
import { DAILY_GOALS, type DailyGoal } from './storage/schema';

export interface DayLog {
  /** Vocabulary cards answered, and how many were not "Again". */
  reviews: number;
  reviewsCorrect: number;
  /** Words seen for the first time. */
  newWords: number;
  /** Drill answers (Hangul drills, typing, number trainer), and how many were right. */
  answers: number;
  correct: number;
  /** Rough active study time. */
  seconds: number;
  /** Ids of today's tasks that are ticked. */
  tasksDone: string[];
  /** Day size chosen for this day, or null to use the default from settings. */
  size: DailyGoal | null;
}

export interface Activity {
  /** Set only if the user edits it; otherwise the first logged day is used. */
  startDate: ISODate | null;
  days: Record<ISODate, DayLog>;
}

export const EMPTY_DAY: DayLog = {
  reviews: 0,
  reviewsCorrect: 0,
  newWords: 0,
  answers: 0,
  correct: 0,
  seconds: 0,
  tasksDone: [],
  size: null,
};

export const EMPTY_ACTIVITY: Activity = { startDate: null, days: {} };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const count = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;

export function sanitizeActivity(raw: unknown): Activity {
  if (!isRecord(raw)) return EMPTY_ACTIVITY;
  const days: Record<ISODate, DayLog> = {};
  if (isRecord(raw.days)) {
    for (const [date, value] of Object.entries(raw.days)) {
      if (!isValidISODate(date) || !isRecord(value)) continue;
      days[date] = {
        reviews: count(value.reviews),
        reviewsCorrect: count(value.reviewsCorrect),
        newWords: count(value.newWords),
        answers: count(value.answers),
        correct: count(value.correct),
        seconds: count(value.seconds),
        tasksDone: Array.isArray(value.tasksDone)
          ? [...new Set(value.tasksDone.filter((t): t is string => typeof t === 'string'))]
          : [],
        size: DAILY_GOALS.includes(value.size as DailyGoal) ? (value.size as DailyGoal) : null,
      };
    }
  }
  return { startDate: isValidISODate(raw.startDate) ? raw.startDate : null, days };
}

/** Returns new activity with one day changed. */
export function updateDay(
  activity: Activity,
  date: ISODate,
  change: (day: DayLog) => DayLog,
): Activity {
  return {
    ...activity,
    days: { ...activity.days, [date]: change(activity.days[date] ?? EMPTY_DAY) },
  };
}

/**
 * Does this day count as studied? One ticked task is enough, and so are five answers.
 * This is deliberately easy: a 5-minute minimum day keeps the streak.
 */
export function isStudied(day: DayLog | undefined): boolean {
  if (!day) return false;
  return day.tasksDone.length > 0 || day.reviews + day.answers >= 5;
}

export function studiedDates(activity: Activity): ISODate[] {
  return Object.keys(activity.days)
    .filter((date) => isStudied(activity.days[date]))
    .sort();
}

/** The day the plan starts from: the edited date, else the first logged day, else today. */
export function effectiveStartDate(activity: Activity, today: ISODate): ISODate {
  if (activity.startDate) return activity.startDate;
  const first = Object.keys(activity.days).sort()[0];
  return first && first < today ? first : today;
}

export interface Totals {
  daysStudied: number;
  reviews: number;
  newWords: number;
  answers: number;
  seconds: number;
  /** Share of right answers over reviews and drills together, or null with no answers. */
  accuracy: number | null;
}

/** Sums the log between two days (inclusive). Omit both for all time. */
export function totals(activity: Activity, from?: ISODate, to?: ISODate): Totals {
  let right = 0;
  const sum: Totals = {
    daysStudied: 0,
    reviews: 0,
    newWords: 0,
    answers: 0,
    seconds: 0,
    accuracy: null,
  };
  for (const [date, day] of Object.entries(activity.days)) {
    if ((from && date < from) || (to && date > to)) continue;
    if (isStudied(day)) sum.daysStudied++;
    sum.reviews += day.reviews;
    sum.newWords += day.newWords;
    sum.answers += day.answers;
    sum.seconds += day.seconds;
    right += day.reviewsCorrect + day.correct;
  }
  const all = sum.reviews + sum.answers;
  sum.accuracy = all > 0 ? right / all : null;
  return sum;
}

/** A light points system: 1 per answer, 10 per finished task. No penalties, ever. */
export function xpOf(activity: Activity): number {
  return Object.values(activity.days).reduce(
    (xp, day) => xp + day.reviews + day.answers + day.tasksDone.length * 10,
    0,
  );
}

export function levelOf(xp: number): { level: number; next: number } {
  // Level n starts at 50 * (n-1)^2 points: 0, 50, 200, 450, 800...
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  return { level, next: 50 * level * level };
}
