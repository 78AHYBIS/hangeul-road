import { describe, expect, it } from 'vitest';
import { GRAMMAR_LESSONS } from '../../content/grammar';
import { ALL_PHRASES, PHRASE_PACKS } from '../../content/phrases';
import { filterPhrases } from './phrasebook';
import { QUIZ_LENGTH, buildQuiz, quizMessage } from './quiz';

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const POLITE = /(요|니다|니까)[.?!]?$/;
/** Short words that are polite as they are. */
const POLITE_WORDS = new Set(['네.', '아니요.']);
/** Polite, allowing a title at the end: "감사합니다, 교수님." */
const isPolite = (text: string) =>
  POLITE_WORDS.has(text) || POLITE.test(text.replace(/,\s*\S+님([.?!])$/, '$1'));

describe('phrase pack content', () => {
  it('has at least 12 packs, with dialogues and enough phrases for a quiz', () => {
    expect(PHRASE_PACKS.length).toBeGreaterThanOrEqual(12);
    for (const pack of PHRASE_PACKS) {
      expect(pack.dialogue.length, pack.id).toBeGreaterThanOrEqual(4);
      expect(pack.phrases.length, pack.id).toBeGreaterThanOrEqual(8);
    }
  });

  it('covers every situation from the spec', () => {
    const titles = PHRASE_PACKS.map((p) => p.title.toLowerCase()).join(' | ');
    for (const s of [
      'first meeting',
      'dorm',
      'restaurant',
      'cafe',
      'convenience',
      'shopping',
      'bus',
      'directions',
      'bank',
      'pharmacy',
      'professor',
      'classmates',
      'emergencies',
    ]) {
      expect(titles, s).toContain(s);
    }
  });

  it('never repeats a phrase id, nor the same phrase twice in a pack', () => {
    expect(new Set(ALL_PHRASES.map((p) => p.id)).size).toBe(ALL_PHRASES.length);
    for (const pack of PHRASE_PACKS) {
      expect(new Set(pack.phrases.map((p) => p.korean)).size, pack.id).toBe(pack.phrases.length);
    }
  });

  it('uses polite speech unless a phrase is clearly marked casual', () => {
    for (const phrase of ALL_PHRASES) {
      if (phrase.casual) {
        expect(phrase.note, phrase.id).toBeTruthy();
        continue;
      }
      expect(isPolite(phrase.korean), phrase.id).toBe(true);
    }
    for (const pack of PHRASE_PACKS) {
      for (const line of pack.dialogue) {
        // Each sentence of a line ends politely (a line may hold two sentences).
        for (const sentence of line.korean.split(/(?<=[.?!])\s+/)) {
          expect(isPolite(sentence), sentence).toBe(true);
        }
      }
    }
  });

  it('links to grammar lessons that exist', () => {
    const ids = new Set(GRAMMAR_LESSONS.map((l) => l.id));
    for (const pack of PHRASE_PACKS) for (const ref of pack.refs ?? []) expect(ids).toContain(ref);
  });
});

describe('phrase quiz', () => {
  const pack = PHRASE_PACKS[0]!;

  it('asks six different phrases with four options, one of them right', () => {
    const quiz = buildQuiz(pack, seeded(3));
    expect(quiz).toHaveLength(QUIZ_LENGTH);
    expect(new Set(quiz.map((q) => q.phrase.id)).size).toBe(QUIZ_LENGTH);
    for (const q of quiz) {
      expect(q.options).toHaveLength(4);
      expect(q.options.filter((o) => o.id === q.phrase.id)).toHaveLength(1);
      expect(new Set(q.options.map((o) => o.meaning)).size).toBe(4);
    }
  });

  it('only asks listening questions when a Korean voice exists', () => {
    expect(buildQuiz(pack, seeded(1)).some((q) => q.kind === 'listen')).toBe(false);
    expect(buildQuiz(pack, seeded(1), { listening: true }).some((q) => q.kind === 'listen')).toBe(
      true,
    );
  });

  it('never asks you to produce a phrase you only hear', () => {
    for (const p of PHRASE_PACKS) {
      for (let seed = 0; seed < 10; seed++) {
        for (const q of buildQuiz(p, seeded(seed))) {
          if (q.phrase.meaning.includes('you will hear')) expect(q.kind).not.toBe('meaning-ko');
        }
      }
    }
  });

  it('closes calmly whatever the score', () => {
    expect(quizMessage(6, 6)).toBe('All correct.');
    expect(quizMessage(1, 6)).not.toMatch(/fail|wrong|bad/i);
  });
});

describe('phrasebook filters', () => {
  it('searches Korean and English, case-insensitively', () => {
    expect(filterPhrases('WATER', 'all', '', []).map((p) => p.id)).toEqual(
      expect.arrayContaining(['phrase-dorm-10']),
    );
    expect(filterPhrases('화장실', 'all', '', []).length).toBeGreaterThanOrEqual(2);
    expect(filterPhrases('zzzz', 'all', '', [])).toEqual([]);
  });

  it('filters by pack and by star, and puts starred phrases first', () => {
    const cafe = filterPhrases('', 'all', 'phrases-cafe', []);
    expect(cafe.every((p) => p.packId === 'phrases-cafe')).toBe(true);
    expect(filterPhrases('', 'starred', '', ['phrase-food-12']).map((p) => p.id)).toEqual([
      'phrase-food-12',
    ]);
    const all = filterPhrases('', 'all', '', ['phrase-help-01']);
    expect(all[0]!.id).toBe('phrase-help-01');
    expect(all).toHaveLength(ALL_PHRASES.length);
  });
});
