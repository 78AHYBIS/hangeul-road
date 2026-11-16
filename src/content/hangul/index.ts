/** Typed access to the Hangul content files. To add or fix content, edit the JSON files. */
import lessonsJson from './lessons.json';
import lettersJson from './letters.json';
import wordsJson from './reading-words.json';
import rulesJson from './rules.json';

export type LetterGroup =
  | 'basic-vowels'
  | 'basic-consonants'
  | 'aspirated-consonants'
  | 'double-consonants'
  | 'compound-vowels';

export interface Letter {
  id: string;
  /** The letter itself, e.g. 'ㄱ'. */
  korean: string;
  group: LetterGroup;
  /** Korean name of the letter, e.g. 기역. */
  name: string;
  /** Short romanized sound label, e.g. 'g / k'. */
  sound: string;
  soundEn: string;
  /** Comparison for a Russian (and Kazakh) speaker. */
  soundRu: string;
  hint: string;
  /** Letters it is easily confused with. */
  confusedWith: string[];
  /** A syllable to speak so the letter can be heard, e.g. 가. */
  speak: string;
}

export interface LetterLesson {
  id: string;
  group: LetterGroup;
  title: string;
  intro: string;
}

export interface RuleExample {
  korean: string;
  /** How it is actually pronounced, written in Hangul. */
  pronounced: string;
  meaning: string;
}

export interface RuleLesson {
  id: string;
  title: string;
  summary: string;
  explanation: string[];
  examples: RuleExample[];
}

export type ReadingCategory = 'loanword' | 'place' | 'brand' | 'sign' | 'food';

export interface ReadingWord {
  id: string;
  korean: string;
  romanization: string;
  meaning: string;
  category: ReadingCategory;
}

export const LETTERS = lettersJson as Letter[];
export const LETTER_LESSONS = lessonsJson as LetterLesson[];
export const RULE_LESSONS = rulesJson as RuleLesson[];
export const READING_WORDS = wordsJson as ReadingWord[];

export const LETTER_BY_JAMO = new Map(LETTERS.map((letter) => [letter.korean, letter]));

export const isVowel = (letter: Letter) => letter.group.endsWith('vowels');

export const READING_CATEGORIES: { id: ReadingCategory; title: string }[] = [
  { id: 'loanword', title: 'Loanwords' },
  { id: 'place', title: 'Places' },
  { id: 'brand', title: 'Brands' },
  { id: 'sign', title: 'Signs' },
  { id: 'food', title: 'Food and menus' },
];

/** Sets of letters that look or sound alike, for the look-alike drill. */
export const LOOKALIKE_GROUPS: string[][] = [
  ['ㅏ', 'ㅓ'],
  ['ㅓ', 'ㅗ'],
  ['ㅗ', 'ㅜ'],
  ['ㅜ', 'ㅡ'],
  ['ㅑ', 'ㅕ'],
  ['ㅛ', 'ㅠ'],
  ['ㅐ', 'ㅔ'],
  ['ㅒ', 'ㅖ'],
  ['ㅘ', 'ㅝ'],
  ['ㅙ', 'ㅚ', 'ㅞ'],
  ['ㅟ', 'ㅢ'],
  ['ㄱ', 'ㅋ', 'ㄲ'],
  ['ㄷ', 'ㅌ', 'ㄸ'],
  ['ㅂ', 'ㅍ', 'ㅃ'],
  ['ㅈ', 'ㅊ', 'ㅉ'],
  ['ㅅ', 'ㅆ', 'ㅈ'],
  ['ㅇ', 'ㅎ', 'ㅁ'],
  ['ㄴ', 'ㄷ', 'ㄹ'],
];
