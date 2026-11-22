/**
 * Daily reminder rules (pure). The browser side lives in `src/app/reminders.ts`.
 *
 * A web app with no server cannot schedule a notification for later. The reminder is
 * shown when the app (or its service worker) is running at or after the chosen time,
 * at most once a day, and only if nothing was studied yet that day.
 */
import type { ISODate } from './date';

/** Minutes since midnight for "HH:MM". */
export function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export interface ReminderCheck {
  on: boolean;
  time: string;
  today: ISODate;
  /** Minutes since local midnight now. */
  nowMinutes: number;
  /** Day the reminder was last shown, if ever. */
  lastShown: ISODate | null;
  studiedToday: boolean;
}

export function reminderDue(c: ReminderCheck): boolean {
  if (!c.on || c.studiedToday || c.lastShown === c.today) return false;
  return c.nowMinutes >= minutesOf(c.time);
}

/** Milliseconds from now until the reminder time today (0 if it has passed). */
export function msUntil(time: string, nowMinutes: number, nowSeconds: number): number {
  const diff = minutesOf(time) * 60 - (nowMinutes * 60 + nowSeconds);
  return Math.max(0, diff * 1000);
}
