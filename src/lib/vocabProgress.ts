/** Saved vocabulary progress: one SRS card per studied word, plus the user's own words. */
import { sanitizeCard, type Card } from './srs';

export interface MyWord {
  id: string;
  korean: string;
  meaning: string;
  note?: string;
}

export interface VocabProgress {
  /** Keyed by word id. A word with no entry is "new". */
  cards: Record<string, Card>;
  myWords: MyWord[];
  /** Deck whose new words are introduced first, or null for the default order. */
  focusDeck: string | null;
}

export const EMPTY_VOCAB_PROGRESS: VocabProgress = { cards: {}, myWords: [], focusDeck: null };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export function sanitizeVocabProgress(raw: unknown): VocabProgress {
  if (!isRecord(raw)) return EMPTY_VOCAB_PROGRESS;
  const cards: Record<string, Card> = {};
  if (isRecord(raw.cards)) {
    for (const [id, value] of Object.entries(raw.cards)) {
      const card = sanitizeCard(value);
      if (card) cards[id] = card;
    }
  }
  const myWords: MyWord[] = [];
  const seen = new Set<string>();
  if (Array.isArray(raw.myWords)) {
    for (const word of raw.myWords) {
      if (!isRecord(word)) continue;
      const { id, korean, meaning, note } = word;
      if (typeof id !== 'string' || typeof korean !== 'string' || typeof meaning !== 'string') {
        continue;
      }
      if (!id || !korean.trim() || !meaning.trim() || seen.has(id)) continue;
      seen.add(id);
      myWords.push({
        id,
        korean: korean.trim(),
        meaning: meaning.trim(),
        ...(typeof note === 'string' && note.trim() ? { note: note.trim() } : {}),
      });
    }
  }
  return { cards, myWords, focusDeck: typeof raw.focusDeck === 'string' ? raw.focusDeck : null };
}
