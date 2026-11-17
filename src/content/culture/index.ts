/**
 * Typed access to the culture topics and cards. To add or fix a card, edit cards.json.
 * Card ids must never change once used: reading progress is saved by id.
 */
import cardsJson from './cards.json';
import topicsJson from './topics.json';

export interface CultureQuizQuestion {
  question: string;
  /** In the order written; the app shuffles them. */
  options: string[];
  answer: string;
  why: string;
}

export interface CultureTopic {
  /** `culture-topic-<slug>` */
  id: string;
  title: string;
  /** Topic name in Korean, shown as a small label. */
  korean: string;
  intro: string;
  quiz: CultureQuizQuestion[];
}

export interface CultureWord {
  korean: string;
  meaning: string;
}

export interface Source {
  name: string;
  url: string;
}

export interface CultureCard {
  /** `culture-<slug>` */
  id: string;
  /** Topic id. */
  topic: string;
  title: string;
  /** One line, shown in lists and on Today. */
  summary: string;
  /** Short paragraphs. */
  body: string[];
  do: string[];
  avoid: string[];
  words: CultureWord[];
  /** "This varies" note, when practice differs between places or people. */
  varies?: string;
  /** Official pages, shown in the card footer. */
  sources?: Source[];
  /** Set when the card states a fact that can change (dates, numbers, routes). */
  lastVerified?: string;
  needsReview?: boolean;
}

/** In display order. The Ulsan and UNIST topic is shown as its own section. */
export const CULTURE_TOPICS = topicsJson as CultureTopic[];
/** Grouped by topic, in reading order within each topic. */
export const CULTURE_CARDS = cardsJson as CultureCard[];

export const ULSAN_TOPIC_ID = 'culture-topic-ulsan';

export function findTopic(id: string | undefined): CultureTopic | undefined {
  return CULTURE_TOPICS.find((t) => t.id === id);
}

export function findCard(id: string | undefined): CultureCard | undefined {
  return CULTURE_CARDS.find((c) => c.id === id);
}

export function cardsInTopic(topicId: string): CultureCard[] {
  return CULTURE_CARDS.filter((c) => c.topic === topicId);
}
