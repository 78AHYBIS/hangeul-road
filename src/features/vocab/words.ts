/** Helpers that combine built-in words with the user's own words. Pure logic. */
import { DECKS, MY_DECK, WORDS, type Deck, type Word } from '../../content/vocab';
import { stageOf, type Card, type CardStage } from '../../lib/srs';
import type { MyWord, VocabProgress } from '../../lib/vocabProgress';

export function myWordToWord(word: MyWord): Word {
  return {
    id: word.id,
    korean: word.korean,
    meaning: word.meaning,
    pos: '',
    deck: MY_DECK.id,
    example: '',
    exampleMeaning: '',
    note: word.note,
  };
}

export function allWords(myWords: MyWord[]): Word[] {
  return [...WORDS, ...myWords.map(myWordToWord)];
}

export function allDecks(): Deck[] {
  return [...DECKS, MY_DECK];
}

/**
 * The order in which new words are introduced: the focus deck first (if any),
 * then the user's own words, then the built-in decks in their numbered order.
 */
export function studyOrder(vocab: VocabProgress): string[] {
  const words = [...vocab.myWords.map(myWordToWord), ...WORDS];
  const focus = words.filter((w) => w.deck === vocab.focusDeck);
  const rest = words.filter((w) => w.deck !== vocab.focusDeck);
  return [...focus, ...rest].map((w) => w.id);
}

export function countStages(words: Word[], cards: Record<string, Card>): Record<CardStage, number> {
  const counts: Record<CardStage, number> = { new: 0, learning: 0, review: 0, mature: 0 };
  for (const word of words) counts[stageOf(cards[word.id])]++;
  return counts;
}

export type CardType = 'ko-meaning' | 'meaning-ko' | 'listening' | 'typing';

/**
 * Which side of the card to test. New and learning cards always show Korean first.
 * After that the type rotates with every review, skipping types that cannot work
 * (listening without a Korean voice, typing when switched off).
 */
export function cardTypeFor(
  card: Card | undefined,
  options: { voice: boolean; typing: boolean },
): CardType {
  if (!card || card.state === 'learning') return 'ko-meaning';
  const types: CardType[] = ['ko-meaning', 'meaning-ko'];
  if (options.voice) types.push('listening');
  if (options.typing) types.push('typing');
  return types[card.reps % types.length]!;
}

/** Compares a typed answer with the word, ignoring spaces. */
export function isTypedCorrect(typed: string, korean: string): boolean {
  const clean = (s: string) => s.normalize('NFC').replace(/\s+/g, '');
  return clean(typed) !== '' && clean(typed) === clean(korean);
}

export function searchWords(words: Word[], query: string, limit = 40): Word[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return words
    .filter((w) => w.korean.includes(q) || w.meaning.toLowerCase().includes(q))
    .slice(0, limit);
}
