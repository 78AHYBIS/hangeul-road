/**
 * Grammar practice sessions: pure functions, randomness passed in as `rng`.
 * Choice items (particle, blank) show shuffled options; tile items (order,
 * translate) show shuffled tiles that the learner taps into a sentence.
 */
import type {
  ChoicePractice,
  GrammarLesson,
  OrderPractice,
  Practice,
  TranslatePractice,
} from '../../content/grammar';
import { shuffle, type Rng } from '../hangul/drills';

export const GAP = '___';

export interface Tile {
  /** Unique within the item, so two tiles with the same text stay distinct. */
  key: string;
  text: string;
}

export type PracticeItem =
  | { kind: 'choice'; practice: ChoicePractice; options: string[] }
  | { kind: 'tiles'; practice: OrderPractice | TranslatePractice; pool: Tile[] };

export const PRACTICE_LABEL: Record<Practice['type'], string> = {
  particle: 'Choose the particle',
  blank: 'Fill the blank',
  order: 'Put the words in order',
  translate: 'Translate with tiles',
};

export function isChoice(practice: Practice): practice is ChoicePractice {
  return practice.type === 'particle' || practice.type === 'blank';
}

/** The sentence with the gap filled in. */
export function fillGap(korean: string, word: string): string {
  return korean.replace(GAP, word);
}

const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();

/** The full correct sentence of any practice item. */
export function correctSentence(practice: Practice): string {
  return isChoice(practice)
    ? fillGap(practice.korean, practice.answer)
    : normalize(practice.tiles.join(' '));
}

/** Tiles joined into a sentence and compared with the answer and accepted variants. */
export function isTilesCorrect(
  practice: OrderPractice | TranslatePractice,
  picked: string[],
): boolean {
  const sentence = normalize(picked.join(' '));
  const accepted = [practice.tiles.join(' '), ...(practice.accept ?? [])].map(normalize);
  return accepted.includes(sentence);
}

/** Shuffled tiles, never left in the correct order (that would give the answer away). */
function shuffledTiles(texts: string[], correct: string[], rng: Rng): Tile[] {
  const tiles = texts.map((text, i) => ({ key: `t${i}`, text }));
  let pool = shuffle(tiles, rng);
  for (let attempt = 0; attempt < 5; attempt++) {
    const sameStart = correct.every((c, i) => pool[i]?.text === c);
    if (!sameStart) return pool;
    pool = shuffle(tiles, rng);
  }
  // Still in order after several tries (tiny pools): move the first tile to the end.
  return [...pool.slice(1), pool[0]!];
}

export function buildItem(practice: Practice, rng: Rng): PracticeItem {
  if (isChoice(practice)) {
    return { kind: 'choice', practice, options: shuffle(practice.options, rng) };
  }
  const texts =
    practice.type === 'translate' ? [...practice.tiles, ...practice.distractors] : practice.tiles;
  return { kind: 'tiles', practice, pool: shuffledTiles(texts, practice.tiles, rng) };
}

/** Every practice item of the lesson, in the lesson's order (easier ones come first). */
export function buildPractice(lesson: GrammarLesson, rng: Rng): PracticeItem[] {
  return lesson.practice.map((p) => buildItem(p, rng));
}
