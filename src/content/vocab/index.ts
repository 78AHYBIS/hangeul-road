/**
 * Typed access to the vocabulary decks.
 * To add a word, add an object to one of the deck-NN-*.json files. Word ids must
 * never change once used, because saved review progress is stored under the id.
 */
import decksJson from './decks.json';

export interface Deck {
  id: string;
  title: string;
  description: string;
}

export interface Word {
  id: string;
  korean: string;
  meaning: string;
  /** Part of speech: noun, verb, adjective, adverb, expression, counter, number... */
  pos: string;
  /** Id of the deck it belongs to. */
  deck: string;
  /** Example sentence in polite style, with its translation. */
  example: string;
  exampleMeaning: string;
  /** Optional: formality, irregular forms, common mistakes. */
  note?: string;
}

// Vite loads every deck file at build time; a new deck-NN-*.json is picked up automatically.
const files = import.meta.glob<Word[]>('./deck-*.json', { eager: true, import: 'default' });

export const DECKS = decksJson as Deck[];

/** All built-in words, in deck order (file names are numbered). */
export const WORDS: Word[] = Object.keys(files)
  .sort()
  .flatMap((path) => files[path]!);

/** The deck of words the user adds in the app. */
export const MY_DECK: Deck = {
  id: 'deck-my-words',
  title: 'My words',
  description: 'Words you added yourself.',
};
