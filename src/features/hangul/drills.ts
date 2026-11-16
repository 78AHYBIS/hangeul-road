/** Builds drill sessions. Pure logic: no React, and randomness is passed in for tests. */
import {
  LETTERS,
  LETTER_BY_JAMO,
  LETTER_LESSONS,
  LOOKALIKE_GROUPS,
  READING_WORDS,
  isVowel,
  type Letter,
} from '../../content/hangul';
import { compose, lettersIn, romanizeSyllable } from '../../lib/hangul';
import { letterStatus, pickWeighted, type HangulProgress } from '../../lib/hangulProgress';

export type Rng = () => number;

export const DRILL_TYPES = [
  'letter-sound',
  'sound-letter',
  'look-alike',
  'syllable',
  'word',
] as const;
export type DrillType = (typeof DRILL_TYPES)[number];

export const DRILL_INFO: Record<DrillType, { title: string; short: string; intro: string }> = {
  'letter-sound': {
    title: 'Letter to sound',
    short: 'See a letter, pick its sound.',
    intro: 'A letter appears. Tap the sound it makes.',
  },
  'sound-letter': {
    title: 'Sound to letter',
    short: 'Hear a sound, pick its letter.',
    intro: 'A sound is shown and played. Tap the letter that makes it.',
  },
  'look-alike': {
    title: 'Look-alike pairs',
    short: 'Tell similar letters apart.',
    intro: 'Pick the right letter from a set of letters that look or sound alike.',
  },
  syllable: {
    title: 'Read the syllable',
    short: 'Read a block aloud, then check yourself.',
    intro: 'Read the syllable out loud, reveal the answer, and mark honestly whether you got it.',
  },
  word: {
    title: 'Read the word',
    short: 'Read a real word aloud, then check yourself.',
    intro: 'Read the word out loud, reveal the answer, and mark honestly whether you got it.',
  },
};

export interface ChoiceQuestion {
  kind: 'choice';
  prompt: string;
  /** True when the prompt is a Korean letter, false when it is a sound label. */
  promptIsKorean: boolean;
  /** Syllable to play for this question. */
  speak: string;
  options: string[];
  answer: string;
  /** Letters whose stats this question updates. */
  letters: string[];
}

export interface ReadQuestion {
  kind: 'read';
  text: string;
  romanization: string;
  meaning?: string;
  letters: string[];
}

export type Question = ChoiceQuestion | ReadQuestion;

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/** Weak and new letters come up more often than solid ones. */
const WEIGHT = { new: 3, learning: 2, solid: 1 };
const weightOf = (progress: HangulProgress, jamo: string) =>
  WEIGHT[letterStatus(progress.letters[jamo])];

/**
 * Letters to drill: those from finished lessons. With fewer than 4 (for example on
 * day one) every letter is included, so the drills always work.
 */
export function drillPool(progress: HangulProgress): Letter[] {
  const doneGroups = LETTER_LESSONS.filter((l) => progress.lessonsDone.includes(l.id)).map(
    (l) => l.group,
  );
  const pool = LETTERS.filter((l) => doneGroups.includes(l.group));
  return pool.length >= 4 ? pool : LETTERS;
}

function letterQuestion(
  target: Letter,
  optionLetters: Letter[],
  direction: 'letter-sound' | 'sound-letter',
  rng: Rng,
): ChoiceQuestion {
  const toSound = direction === 'letter-sound';
  return {
    kind: 'choice',
    prompt: toSound ? target.korean : target.sound,
    promptIsKorean: toSound,
    speak: target.speak,
    options: shuffle(optionLetters, rng).map((l) => (toSound ? l.sound : l.korean)),
    answer: toSound ? target.sound : target.korean,
    letters: [target.korean],
  };
}

const SIMPLE_FINALS = ['ㄱ', 'ㄴ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅇ'];

export function randomSyllable(pool: Letter[], rng: Rng): string {
  const consonants = pool.filter((l) => !isVowel(l)).map((l) => l.korean);
  const vowels = pool.filter(isVowel).map((l) => l.korean);
  const pick = (items: string[]) => items[Math.floor(rng() * items.length)]!;
  const initial = pick(consonants.length > 0 ? consonants : ['ㅇ']);
  const medial = pick(vowels.length > 0 ? vowels : ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ']);
  const finals = SIMPLE_FINALS.filter((f) => consonants.includes(f));
  const final = finals.length > 0 && rng() < 0.3 ? pick(finals) : '';
  return compose(initial, medial, final);
}

export function buildSession(
  type: DrillType,
  progress: HangulProgress,
  count = 10,
  rng: Rng = Math.random,
): Question[] {
  const pool = drillPool(progress);
  const questions: Question[] = [];
  let previous = '';

  for (let n = 0; n < count; n++) {
    if (type === 'letter-sound' || type === 'sound-letter') {
      const target = pickWeighted(
        pool.filter((l) => l.korean !== previous),
        (l) => weightOf(progress, l.korean),
        rng,
      );
      // Wrong options come from the same kind of letter (vowel or consonant).
      const others = shuffle(
        LETTERS.filter((l) => isVowel(l) === isVowel(target) && l.korean !== target.korean),
        rng,
      ).slice(0, 3);
      questions.push(letterQuestion(target, [target, ...others], type, rng));
      previous = target.korean;
    } else if (type === 'look-alike') {
      const inPool = new Set(pool.map((l) => l.korean));
      const groups = LOOKALIKE_GROUPS.filter((g) => g.some((jamo) => inPool.has(jamo)));
      const group = pickWeighted(
        groups,
        (g) => Math.max(...g.map((jamo) => weightOf(progress, jamo))),
        rng,
      );
      const candidates = group.filter((jamo) => jamo !== previous);
      const target = LETTER_BY_JAMO.get(candidates[Math.floor(rng() * candidates.length)]!)!;
      const options = group.map((jamo) => LETTER_BY_JAMO.get(jamo)!);
      questions.push(letterQuestion(target, options, 'sound-letter', rng));
      previous = target.korean;
    } else if (type === 'syllable') {
      const text = randomSyllable(pool, rng);
      questions.push({
        kind: 'read',
        text,
        romanization: romanizeSyllable(text),
        letters: lettersIn(text),
      });
    }
  }

  if (type === 'word') {
    for (const word of shuffle(READING_WORDS, rng).slice(0, count)) {
      questions.push({
        kind: 'read',
        text: word.korean,
        romanization: word.romanization,
        meaning: word.meaning,
        letters: lettersIn(word.korean),
      });
    }
  }
  return questions;
}

/** Items for the timed reading drill: syllables, plus real words once all letters are learned. */
export function buildTimedItems(
  progress: HangulProgress,
  count = 150,
  rng: Rng = Math.random,
): string[] {
  const pool = drillPool(progress);
  const allLessonsDone = LETTER_LESSONS.every((l) => progress.lessonsDone.includes(l.id));
  const items: string[] = [];
  for (let n = 0; n < count; n++) {
    items.push(
      allLessonsDone && rng() < 0.5
        ? READING_WORDS[Math.floor(rng() * READING_WORDS.length)]!.korean
        : randomSyllable(pool, rng),
    );
  }
  return items;
}
