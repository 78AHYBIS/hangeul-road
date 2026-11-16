/** Saved Hangul progress: per-letter drill accuracy, reading speed and finished lessons. */
import { isValidISODate, type ISODate } from './date';

export interface LetterStat {
  seen: number;
  correct: number;
  /** The most recent answers, oldest first (at most RECENT_SIZE). */
  recent: boolean[];
}

export interface ReadingSpeedEntry {
  date: ISODate;
  perMinute: number;
  items: number;
  seconds: number;
}

export interface HangulProgress {
  /** Keyed by the letter itself, e.g. 'ㄱ'. */
  letters: Record<string, LetterStat>;
  readingSpeed: ReadingSpeedEntry[];
  lessonsDone: string[];
}

export const RECENT_SIZE = 10;
const SOLID_MIN_ANSWERS = 6;
const SOLID_ACCURACY = 0.85;
const MAX_SPEED_ENTRIES = 200;

export const EMPTY_HANGUL_PROGRESS: HangulProgress = {
  letters: {},
  readingSpeed: [],
  lessonsDone: [],
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const count = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;

/** Turns stored or imported data into valid progress; anything malformed is dropped. */
export function sanitizeHangulProgress(raw: unknown): HangulProgress {
  if (!isRecord(raw)) return EMPTY_HANGUL_PROGRESS;
  const letters: Record<string, LetterStat> = {};
  if (isRecord(raw.letters)) {
    for (const [jamo, value] of Object.entries(raw.letters)) {
      if (!isRecord(value)) continue;
      const seen = count(value.seen);
      letters[jamo] = {
        seen,
        correct: Math.min(seen, count(value.correct)),
        recent: Array.isArray(value.recent)
          ? value.recent.filter((r): r is boolean => typeof r === 'boolean').slice(-RECENT_SIZE)
          : [],
      };
    }
  }
  const readingSpeed: ReadingSpeedEntry[] = [];
  if (Array.isArray(raw.readingSpeed)) {
    for (const entry of raw.readingSpeed) {
      if (!isRecord(entry) || !isValidISODate(entry.date)) continue;
      readingSpeed.push({
        date: entry.date,
        perMinute: count(entry.perMinute),
        items: count(entry.items),
        seconds: count(entry.seconds),
      });
    }
  }
  const lessonsDone = Array.isArray(raw.lessonsDone)
    ? [...new Set(raw.lessonsDone.filter((id): id is string => typeof id === 'string'))]
    : [];
  return { letters, readingSpeed: readingSpeed.slice(-MAX_SPEED_ENTRIES), lessonsDone };
}

/** Returns new progress with one answer recorded for each of `letters`. */
export function recordLetterResults(
  progress: HangulProgress,
  letters: string[],
  correct: boolean,
): HangulProgress {
  const next = { ...progress.letters };
  for (const jamo of letters) {
    const stat = next[jamo] ?? { seen: 0, correct: 0, recent: [] };
    next[jamo] = {
      seen: stat.seen + 1,
      correct: stat.correct + (correct ? 1 : 0),
      recent: [...stat.recent, correct].slice(-RECENT_SIZE),
    };
  }
  return { ...progress, letters: next };
}

export function addReadingSpeedEntry(
  progress: HangulProgress,
  entry: ReadingSpeedEntry,
): HangulProgress {
  return {
    ...progress,
    readingSpeed: [...progress.readingSpeed, entry].slice(-MAX_SPEED_ENTRIES),
  };
}

export type LetterStatus = 'new' | 'learning' | 'solid';

/**
 * new: never drilled. solid: at least 6 recent answers and 85% of them right.
 * Only recent answers count, so early mistakes do not hold a letter back forever.
 */
export function letterStatus(stat: LetterStat | undefined): LetterStatus {
  if (!stat || stat.seen === 0) return 'new';
  const right = stat.recent.filter(Boolean).length;
  if (stat.recent.length >= SOLID_MIN_ANSWERS && right / stat.recent.length >= SOLID_ACCURACY) {
    return 'solid';
  }
  return 'learning';
}

/** Picks one item at random, where a higher weight means a higher chance. */
export function pickWeighted<T>(
  items: readonly T[],
  weight: (item: T) => number,
  rng: () => number = Math.random,
): T {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= weight(item);
    if (roll < 0) return item;
  }
  return items[items.length - 1]!;
}
