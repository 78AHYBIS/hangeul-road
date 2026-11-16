/** Numbers for the weekly review screen. Pure logic. */
import { LETTER_LESSONS, RULE_LESSONS } from '../../content/hangul';
import { totals, type Activity, type Totals } from '../../lib/activity';
import { addDays, type ISODate } from '../../lib/date';
import type { HangulProgress } from '../../lib/hangulProgress';
import type { Card } from '../../lib/srs';

export interface WeakLetter {
  jamo: string;
  accuracy: number;
}

/** Drilled letters with the lowest recent accuracy (below 85%). */
export function weakestLetters(hangul: HangulProgress, limit = 6): WeakLetter[] {
  return Object.entries(hangul.letters)
    .filter(([, stat]) => stat.recent.length > 0)
    .map(([jamo, stat]) => ({
      jamo,
      accuracy: stat.recent.filter(Boolean).length / stat.recent.length,
    }))
    .filter((l) => l.accuracy < 0.85)
    .sort((a, b) => a.accuracy - b.accuracy || a.jamo.localeCompare(b.jamo))
    .slice(0, limit);
}

/** Word ids forgotten most often. */
export function hardestWords(cards: Record<string, Card>, limit = 6): string[] {
  return Object.entries(cards)
    .filter(([, card]) => card.lapses > 0)
    .sort(([idA, a], [idB, b]) => b.lapses - a.lapses || idA.localeCompare(idB))
    .slice(0, limit)
    .map(([id]) => id);
}

export interface WeekSummary {
  from: ISODate;
  to: ISODate;
  totals: Totals;
  weakLetters: WeakLetter[];
  hardWords: string[];
  focus: string;
}

/** One suggestion for next week, picked from the most pressing need. */
export function suggestFocus(
  week: Totals,
  weakLetters: WeakLetter[],
  hardWords: string[],
  hangul: HangulProgress,
): string {
  if (week.daysStudied === 0) {
    return 'Start small: one minimum day (about five minutes) is enough to get going.';
  }
  if (week.daysStudied <= 3) {
    return 'Aim for more days, not longer days. A minimum day counts and keeps the habit.';
  }
  const lessonsLeft = [...LETTER_LESSONS, ...RULE_LESSONS].filter(
    (l) => !hangul.lessonsDone.includes(l.id),
  );
  if (weakLetters.length >= 3) {
    return `Give extra time to the look-alike drill. These letters need it most: ${weakLetters
      .map((l) => l.jamo)
      .join(' ')}`;
  }
  if (week.accuracy !== null && week.accuracy < 0.7) {
    return 'Accuracy was low this week. Switch to minimum days for a while so reviews stay easy.';
  }
  if (lessonsLeft.length > 0) return `Finish the next Hangul lesson: ${lessonsLeft[0]!.title}.`;
  if (hardWords.length >= 3) {
    return 'A few words keep slipping. Read their example sentences aloud when they come up.';
  }
  return 'Good week. Keep the same rhythm, and try the timed reading drill to build speed.';
}

/** The last seven days, ending today. */
export function weekSummary(
  activity: Activity,
  hangul: HangulProgress,
  cards: Record<string, Card>,
  today: ISODate,
): WeekSummary {
  const from = addDays(today, -6);
  const week = totals(activity, from, today);
  const weakLetters = weakestLetters(hangul);
  const hardWords = hardestWords(cards);
  return {
    from,
    to: today,
    totals: week,
    weakLetters,
    hardWords,
    focus: suggestFocus(week, weakLetters, hardWords, hangul),
  };
}
