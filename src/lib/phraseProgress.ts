/**
 * Saved phrase progress: finished packs (quiz done), last quiz score per pack,
 * starred phrases for the phrasebook, and the self-introduction details.
 */
import { sanitizeIds, sanitizeResults, type PracticeResult } from './grammarProgress';
import { EMPTY_INTRO, sanitizeIntro, type IntroDetails } from './selfIntro';

export interface PhraseProgress {
  /** Ids of finished packs. */
  done: string[];
  results: Record<string, PracticeResult>;
  /** Starred phrase ids, most recent last. */
  starred: string[];
  intro: IntroDetails;
}

export const EMPTY_PHRASE_PROGRESS: PhraseProgress = {
  done: [],
  results: {},
  starred: [],
  intro: EMPTY_INTRO,
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export function sanitizePhraseProgress(raw: unknown): PhraseProgress {
  if (!isRecord(raw)) return EMPTY_PHRASE_PROGRESS;
  return {
    done: sanitizeIds(raw.done),
    results: sanitizeResults(raw.results),
    starred: sanitizeIds(raw.starred),
    intro: sanitizeIntro(raw.intro),
  };
}

export function toggleStar(progress: PhraseProgress, phraseId: string): PhraseProgress {
  const starred = progress.starred.includes(phraseId)
    ? progress.starred.filter((id) => id !== phraseId)
    : [...progress.starred, phraseId];
  return { ...progress, starred };
}
