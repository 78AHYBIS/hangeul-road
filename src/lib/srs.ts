/**
 * Spaced repetition (SM-2 style). Pure functions: given a card and an answer,
 * return the card's next state. Nothing here touches storage or the clock.
 *
 * Life of a card:
 *   new      -> no saved record yet
 *   learning -> just introduced, or forgotten ("Again"); comes back the same day
 *   review   -> remembered; shown again after `interval` days
 *   mature   -> a review card whose interval reached 21 days
 */
import { addDays, type ISODate } from './date';
import type { DailyGoal } from './storage/schema';

export type Grade = 'again' | 'hard' | 'good' | 'easy';
export const GRADES: Grade[] = ['again', 'hard', 'good', 'easy'];

export interface Card {
  state: 'learning' | 'review';
  due: ISODate;
  /** Days until the next review. 0 while learning. */
  interval: number;
  /** Growth factor for the interval. Starts at 2.5, never below 1.3. */
  ease: number;
  reps: number;
  /** Times the card was forgotten after being learned. */
  lapses: number;
  /** Day the card was first shown. Used for the new-cards-per-day limit. */
  introduced: ISODate;
}

export type CardStage = 'new' | 'learning' | 'review' | 'mature';

export const MATURE_DAYS = 21;
export const START_EASE = 2.5;
export const MIN_EASE = 1.3;
export const MAX_INTERVAL = 365;

export function stageOf(card: Card | undefined): CardStage {
  if (!card) return 'new';
  if (card.state === 'learning') return 'learning';
  return card.interval >= MATURE_DAYS ? 'mature' : 'review';
}

/** Returns the card after one answer. `card` is undefined for a brand-new word. */
export function review(card: Card | undefined, grade: Grade, today: ISODate): Card {
  const current: Card = card ?? {
    state: 'learning',
    due: today,
    interval: 0,
    ease: START_EASE,
    reps: 0,
    lapses: 0,
    introduced: today,
  };
  let { state, interval, ease, lapses } = current;

  if (current.state === 'learning') {
    if (grade === 'again') {
      interval = 0;
    } else if (grade === 'hard') {
      interval = 1; // see it again tomorrow, still learning
    } else {
      state = 'review';
      // "Good" graduates to 1 day, or 3 days if it already survived a day.
      interval = grade === 'easy' ? 4 : current.interval >= 1 ? 3 : 1;
    }
  } else if (grade === 'again') {
    // A lapse: relearn it today, and grow more slowly from now on.
    state = 'learning';
    interval = 0;
    lapses += 1;
    ease = Math.max(MIN_EASE, ease - 0.2);
  } else {
    const factor = grade === 'hard' ? 1.2 : grade === 'good' ? ease : ease * 1.3;
    if (grade === 'hard') ease = Math.max(MIN_EASE, ease - 0.15);
    if (grade === 'easy') ease += 0.15;
    // Always at least one day longer than before.
    interval = Math.min(MAX_INTERVAL, Math.max(interval + 1, Math.round(interval * factor)));
  }

  return {
    ...current,
    state,
    interval,
    ease: Math.round(ease * 100) / 100,
    lapses,
    reps: current.reps + 1,
    due: addDays(today, interval),
  };
}

export interface DailyLimits {
  newPerDay: number;
  /** Most reviews shown in one day, however many are overdue. */
  reviewCap: number;
}

export const LIMITS: Record<DailyGoal, DailyLimits> = {
  minimum: { newPerDay: 5, reviewCap: 20 },
  normal: { newPerDay: 10, reviewCap: 50 },
  intense: { newPerDay: 15, reviewCap: 100 },
};

export interface Queue {
  /** Due cards to review today (already capped). */
  reviews: string[];
  /** New words to introduce today. */
  newCards: string[];
  /** All due cards, before the cap. */
  dueTotal: number;
}

/**
 * Decides what to study today.
 * - Reviews: due cards, most overdue first, at most `reviewCap`. The rest simply wait;
 *   they are never added on top of tomorrow's cap.
 * - New words: in the given order, up to `newPerDay` minus those already introduced
 *   today. None at all while there is a review backlog above the cap.
 */
export function buildQueue(
  cards: Record<string, Card>,
  orderedIds: string[],
  today: ISODate,
  limits: DailyLimits,
): Queue {
  const known = new Set(orderedIds);
  const due = Object.entries(cards)
    .filter(([id, card]) => known.has(id) && card.due <= today)
    .sort(([idA, a], [idB, b]) => a.due.localeCompare(b.due) || idA.localeCompare(idB))
    .map(([id]) => id);

  const introducedToday = Object.values(cards).filter((c) => c.introduced === today).length;
  const backlog = due.length > limits.reviewCap;
  const newAllowed = backlog ? 0 : Math.max(0, limits.newPerDay - introducedToday);

  return {
    reviews: due.slice(0, limits.reviewCap),
    newCards: orderedIds.filter((id) => !cards[id]).slice(0, newAllowed),
    dueTotal: due.length,
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const num = (v: unknown, fallback: number, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

/** Validates one stored card. Returns null if it cannot be trusted. */
export function sanitizeCard(raw: unknown): Card | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.due !== 'string' || !ISO.test(raw.due)) return null;
  return {
    state: raw.state === 'review' ? 'review' : 'learning',
    due: raw.due,
    interval: Math.round(num(raw.interval, 0, 0, MAX_INTERVAL)),
    ease: num(raw.ease, START_EASE, MIN_EASE, 5),
    reps: Math.round(num(raw.reps, 0, 0, 1e6)),
    lapses: Math.round(num(raw.lapses, 0, 0, 1e6)),
    introduced:
      typeof raw.introduced === 'string' && ISO.test(raw.introduced) ? raw.introduced : raw.due,
  };
}
