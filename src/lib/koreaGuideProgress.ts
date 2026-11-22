/**
 * Saved Korea guide progress: which arrival-checklist items are ticked, and on which day.
 * Item ids come from src/content/korea-apps/checklists.json and never change.
 */
import { isValidISODate, type ISODate } from './date';

export interface KoreaGuideProgress {
  /** Checklist item id -> the day it was ticked. */
  checked: Record<string, ISODate>;
}

export const EMPTY_KOREA_GUIDE_PROGRESS: KoreaGuideProgress = { checked: {} };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Turns saved or imported data into valid progress; bad entries are dropped. */
export function sanitizeKoreaGuideProgress(raw: unknown): KoreaGuideProgress {
  if (!isRecord(raw) || !isRecord(raw.checked)) return EMPTY_KOREA_GUIDE_PROGRESS;
  const checked: Record<string, ISODate> = {};
  for (const [id, date] of Object.entries(raw.checked)) {
    if (id && isValidISODate(date)) checked[id] = date;
  }
  return { checked };
}

/** Ticks an item on `today`, or unticks it. */
export function setChecked(
  progress: KoreaGuideProgress,
  itemId: string,
  checked: boolean,
  today: ISODate,
): KoreaGuideProgress {
  const next = { ...progress.checked };
  if (checked) next[itemId] = today;
  else delete next[itemId];
  return { checked: next };
}
