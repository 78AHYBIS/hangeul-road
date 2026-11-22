/**
 * Global search across words, phrases, grammar, culture cards, resources, apps and
 * "How do I…" answers. Pure: content is passed in (defaults to the built-in content),
 * so it is unit-tested without the UI.
 */
import { GRAMMAR_LESSONS, type GrammarLesson } from '../../content/grammar';
import { CULTURE_CARDS, type CultureCard } from '../../content/culture';
import { HOW_TOS, KOREA_APPS, type HowTo, type KoreaApp } from '../../content/korea-apps';
import { ALL_PHRASES, type PhraseWithPack } from '../../content/phrases';
import { WORDS, type Word } from '../../content/vocab';
import type { LibraryItem } from '../library/resources';

export type ResultKind = 'word' | 'phrase' | 'grammar' | 'culture' | 'resource' | 'app' | 'howto';

export const KIND_TITLE: Record<ResultKind, string> = {
  word: 'Words',
  phrase: 'Phrases',
  grammar: 'Grammar',
  culture: 'Korea life',
  resource: 'Library',
  app: 'Korea apps',
  howto: 'How do I…',
};

/** Display order of the result groups. */
export const KINDS: ResultKind[] = [
  'word',
  'phrase',
  'grammar',
  'culture',
  'app',
  'howto',
  'resource',
];

export interface SearchResult {
  kind: ResultKind;
  id: string;
  /** Main line. Korean for words and phrases. */
  title: string;
  /** Second line: meaning or summary. */
  detail: string;
  /** Route inside the app. */
  to: string;
  /** Korean text to play with a SpeakButton (words and phrases). */
  speak?: string;
  score: number;
}

interface Entry {
  result: Omit<SearchResult, 'score'>;
  /** Searched fields, most important first: name, meaning, then longer text. */
  primary: string[];
  secondary: string[];
  body: string[];
}

export interface SearchContent {
  words: Word[];
  phrases: PhraseWithPack[];
  grammar: GrammarLesson[];
  culture: CultureCard[];
  resources: LibraryItem[];
  apps: KoreaApp[];
  howtos: HowTo[];
}

export function buildIndex(c: Partial<SearchContent> & { resources: LibraryItem[] }): Entry[] {
  const words = c.words ?? WORDS;
  const phrases = c.phrases ?? ALL_PHRASES;
  const grammar = c.grammar ?? GRAMMAR_LESSONS;
  const culture = c.culture ?? CULTURE_CARDS;
  const apps = c.apps ?? KOREA_APPS;
  const howtos = c.howtos ?? HOW_TOS;
  const enc = encodeURIComponent;
  return [
    ...words.map((w) => ({
      result: {
        kind: 'word' as const,
        id: w.id,
        title: w.korean,
        detail: w.meaning,
        to:
          w.deck === 'deck-my-words' ? '/learn/vocab/my-words' : `/learn/vocab/deck/${enc(w.deck)}`,
        speak: w.korean,
      },
      primary: [w.korean, w.meaning],
      secondary: [w.note ?? ''],
      body: [w.example, w.exampleMeaning],
    })),
    ...phrases.map((p) => ({
      result: {
        kind: 'phrase' as const,
        id: p.id,
        title: p.korean,
        detail: p.meaning,
        to: `/learn/phrases/${enc(p.packId)}`,
        speak: p.korean,
      },
      primary: [p.korean, p.meaning],
      secondary: [p.packTitle],
      body: [p.note ?? ''],
    })),
    ...grammar.map((g) => ({
      result: {
        kind: 'grammar' as const,
        id: g.id,
        title: g.title,
        detail: g.summary,
        to: `/learn/grammar/${enc(g.id)}`,
      },
      primary: [g.title, g.pattern],
      secondary: [g.summary],
      body: [...g.explanation, ...g.examples.flatMap((e) => [e.korean, e.meaning])],
    })),
    ...culture.map((card) => ({
      result: {
        kind: 'culture' as const,
        id: card.id,
        title: card.title,
        detail: card.summary,
        to: `/korea/card/${enc(card.id)}`,
      },
      primary: [card.title],
      secondary: [card.summary, ...card.words.flatMap((w) => [w.korean, w.meaning])],
      body: [...card.body, ...card.do, ...card.avoid],
    })),
    ...c.resources.map((r) => ({
      result: {
        kind: 'resource' as const,
        id: r.id,
        title: r.name,
        detail: r.description,
        to: `/library/${enc(r.id)}`,
      },
      primary: [r.name],
      secondary: [r.description, r.type],
      body: [r.why, r.note ?? ''],
    })),
    ...apps.map((a) => ({
      result: {
        kind: 'app' as const,
        id: a.id,
        title: a.name,
        detail: a.what,
        to: `/korea/apps/${enc(a.id)}`,
      },
      primary: [a.name, a.korean ?? ''],
      secondary: [a.what, a.category],
      body: [a.why, a.access],
    })),
    ...howtos.map((h) => ({
      result: {
        kind: 'howto' as const,
        id: h.id,
        title: `How do I ${h.question}`,
        detail: h.answer,
        to: `/korea/howto/${enc(h.id)}`,
      },
      primary: [h.question],
      secondary: [h.answer],
      body: h.steps,
    })),
  ];
}

const clean = (s: string) => s.normalize('NFC').toLowerCase();

/** How well one search word matches a field: whole field, start of a word, anywhere. */
function fieldScore(field: string, word: string): number {
  const f = clean(field);
  if (!f.includes(word)) return 0;
  if (f === word || f === `to ${word}`) return 10;
  if (f.startsWith(word)) return 6;
  // Start of a word: "drink" in "to drink", "cafe" in "a cafe".
  if (new RegExp(`(^|[\\s(/,'"-])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(f)) return 4;
  return 2;
}

function entryScore(entry: Entry, words: string[]): number {
  let total = 0;
  for (const word of words) {
    const best = Math.max(
      ...entry.primary.map((f) => fieldScore(f, word) * 10),
      ...entry.secondary.map((f) => fieldScore(f, word) * 3),
      ...entry.body.map((f) => fieldScore(f, word)),
      0,
    );
    if (best === 0) return 0; // every search word must match somewhere
    total += best;
  }
  return total;
}

/** All matches, best first. Every word of the query must match. */
export function search(index: Entry[], query: string): SearchResult[] {
  const words = clean(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const results: SearchResult[] = [];
  for (const entry of index) {
    const score = entryScore(entry, words);
    if (score > 0) results.push({ ...entry.result, score });
  }
  return results.sort((a, b) => b.score - a.score);
}

/** Results grouped by kind, in display order; empty groups left out. */
export function groupResults(results: SearchResult[]): [ResultKind, SearchResult[]][] {
  return KINDS.map(
    (kind) => [kind, results.filter((r) => r.kind === kind)] as [ResultKind, SearchResult[]],
  ).filter(([, list]) => list.length > 0);
}
