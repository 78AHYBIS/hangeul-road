/** Saved grammar progress: finished lessons and the last practice score of each. */
import { isValidISODate, type ISODate } from './date';

export interface PracticeResult {
  correct: number;
  total: number;
  date: ISODate;
}

export interface GrammarProgress {
  /** Ids of finished lessons, in the order they were finished. */
  done: string[];
  /** Last practice score per lesson id. */
  results: Record<string, PracticeResult>;
}

export const EMPTY_GRAMMAR_PROGRESS: GrammarProgress = { done: [], results: {} };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const count = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;

/** A list of distinct, non-empty ids. Shared with phraseProgress. */
export function sanitizeIds(raw: unknown, max = 1000): string[] {
  return Array.isArray(raw)
    ? [...new Set(raw.filter((id): id is string => typeof id === 'string' && id !== ''))].slice(
        0,
        max,
      )
    : [];
}

/** Scores keyed by id; malformed entries are dropped. Shared with phraseProgress. */
export function sanitizeResults(raw: unknown): Record<string, PracticeResult> {
  const results: Record<string, PracticeResult> = {};
  if (!isRecord(raw)) return results;
  for (const [id, value] of Object.entries(raw)) {
    if (!id || !isRecord(value) || !isValidISODate(value.date)) continue;
    const total = count(value.total);
    if (total === 0) continue;
    results[id] = { correct: Math.min(total, count(value.correct)), total, date: value.date };
  }
  return results;
}

export function sanitizeGrammarProgress(raw: unknown): GrammarProgress {
  if (!isRecord(raw)) return EMPTY_GRAMMAR_PROGRESS;
  return { done: sanitizeIds(raw.done), results: sanitizeResults(raw.results) };
}

/** Adds an id to a done list (no duplicates). */
export function addDone(done: string[], id: string): string[] {
  return done.includes(id) ? done : [...done, id];
}

/**
 * The finished item with the lowest last score, to practise again. Items never
 * practised count as 0%. Ties go to the one practised longest ago, then to list order.
 */
export function weakest(done: string[], results: Record<string, PracticeResult>): string | null {
  let best: { id: string; score: number; date: string } | null = null;
  for (const id of done) {
    const r = results[id];
    const score = r ? r.correct / r.total : 0;
    const date = r?.date ?? '';
    if (!best || score < best.score || (score === best.score && date < best.date)) {
      best = { id, score, date };
    }
  }
  return best?.id ?? null;
}
