/**
 * Saved culture progress: which cards were read (and on which day), and the last quiz
 * score per topic. The read date lets Today keep a card read today in place.
 */
import { isValidISODate, type ISODate } from './date';
import { sanitizeResults, type PracticeResult } from './grammarProgress';

export interface CultureProgress {
  /** Card id -> the day it was last read. */
  read: Record<string, ISODate>;
  /** Last quiz score per topic id. */
  results: Record<string, PracticeResult>;
}

export const EMPTY_CULTURE_PROGRESS: CultureProgress = { read: {}, results: {} };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export function sanitizeCultureProgress(raw: unknown): CultureProgress {
  if (!isRecord(raw)) return EMPTY_CULTURE_PROGRESS;
  const read: Record<string, ISODate> = {};
  if (isRecord(raw.read)) {
    for (const [id, date] of Object.entries(raw.read)) {
      if (id && isValidISODate(date)) read[id] = date;
    }
  }
  return { read, results: sanitizeResults(raw.results) };
}

/** Marks a card read on `today`, or unread. */
export function setRead(
  progress: CultureProgress,
  cardId: string,
  read: boolean,
  today: ISODate,
): CultureProgress {
  const next = { ...progress.read };
  if (read) next[cardId] = today;
  else delete next[cardId];
  return { ...progress, read: next };
}

/** The marker logged in today's tasksDone when a card is read (equals the Today task id). */
export const cardMarker = (cardId: string) => `culture:${cardId}`;
/** The marker logged when a topic quiz is finished. */
export const quizMarker = (topicId: string) => `culture:quiz:${topicId}`;
