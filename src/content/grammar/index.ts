/**
 * Typed access to the grammar lessons. To add or fix a lesson, edit lessons.json.
 * Lesson ids must never change once used: finished lessons are saved by id.
 */
import lessonsJson from './lessons.json';

export interface GrammarExample {
  korean: string;
  meaning: string;
  note?: string;
}

/** Pick the right particle or word for the gap (`___`) in a sentence. */
export interface ChoicePractice {
  /** 'particle' for particles, 'blank' for verb forms and other words. */
  type: 'particle' | 'blank';
  /** The sentence with exactly one `___` gap. */
  korean: string;
  options: string[];
  answer: string;
  meaning: string;
  /** Short reason, shown after answering. */
  why?: string;
}

/** Put the tiles in order. `tiles` is the correct order; the app shuffles them. */
export interface OrderPractice {
  type: 'order';
  tiles: string[];
  meaning: string;
  /** Other word orders that are also correct, as full sentences. */
  accept?: string[];
}

/** Build the Korean for an English sentence from tiles, some of them wrong. */
export interface TranslatePractice {
  type: 'translate';
  meaning: string;
  tiles: string[];
  distractors: string[];
  accept?: string[];
}

export type Practice = ChoicePractice | OrderPractice | TranslatePractice;
export type PracticeType = Practice['type'];

export interface GrammarLesson {
  id: string;
  title: string;
  summary: string;
  /** The pattern in short form, e.g. "Noun + 이에요 / 예요". */
  pattern: string;
  explanation: string[];
  examples: GrammarExample[];
  practice: Practice[];
}

/** In study order. */
export const GRAMMAR_LESSONS = lessonsJson as GrammarLesson[];

export function findGrammarLesson(id: string | undefined): GrammarLesson | undefined {
  return GRAMMAR_LESSONS.find((l) => l.id === id);
}
