import { describe, expect, it } from 'vitest';
import { DECKS, WORDS } from '../../content/vocab';
import { review } from '../../lib/srs';
import { EMPTY_VOCAB_PROGRESS, sanitizeVocabProgress } from '../../lib/vocabProgress';
import { NUMBER_MODES, buildNumberSession } from './numberDrill';
import { cardTypeFor, countStages, isTypedCorrect, searchWords, studyOrder } from './words';

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

describe('vocabulary content', () => {
  it('has 15 decks of 30 to 50 words and at least 600 words', () => {
    expect(DECKS).toHaveLength(15);
    expect(WORDS.length).toBeGreaterThanOrEqual(600);
    for (const deck of DECKS) {
      const size = WORDS.filter((w) => w.deck === deck.id).length;
      expect(size, deck.id).toBeGreaterThanOrEqual(30);
      expect(size, deck.id).toBeLessThanOrEqual(50);
    }
  });

  it('never repeats a word or an id', () => {
    expect(new Set(WORDS.map((w) => w.korean)).size).toBe(WORDS.length);
    expect(new Set(WORDS.map((w) => w.id)).size).toBe(WORDS.length);
  });

  it('gives every word a polite example sentence with a translation', () => {
    for (const word of WORDS) {
      // Polite endings: ...요 (해요 style) or ...니다 (합니다 style).
      expect(word.example, word.korean).toMatch(/(요|니다)[.?!]$/);
      expect(word.exampleMeaning.length, word.korean).toBeGreaterThan(2);
      expect(word.pos, word.korean).not.toBe('');
    }
  });

  it('keeps the deck order from the roadmap', () => {
    expect(WORDS[0]!.deck).toBe('deck-greetings');
    expect(WORDS[WORDS.length - 1]!.deck).toBe('deck-social');
  });
});

describe('study order and stages', () => {
  it('puts the focus deck first, then my words, then the rest', () => {
    const vocab = sanitizeVocabProgress({
      myWords: [{ id: 'my-1', korean: '고양이', meaning: 'cat' }],
      focusDeck: 'deck-food',
    });
    const order = studyOrder(vocab);
    expect(order[0]).toBe('vocab-food-음식');
    expect(order.indexOf('my-1')).toBe(WORDS.filter((w) => w.deck === 'deck-food').length);
    expect(order).toHaveLength(WORDS.length + 1);
    expect(studyOrder(EMPTY_VOCAB_PROGRESS)[0]).toBe('vocab-greetings-안녕하세요');
  });

  it('counts words by stage', () => {
    const id = WORDS[0]!.id;
    const counts = countStages(WORDS, { [id]: review(undefined, 'good', '2026-11-16') });
    expect(counts).toEqual({ new: WORDS.length - 1, learning: 0, review: 1, mature: 0 });
  });
});

describe('card types', () => {
  const learned = review(undefined, 'good', '2026-11-16'); // reps 1
  const all = { voice: true, typing: true };

  it('shows Korean first for new and learning cards', () => {
    expect(cardTypeFor(undefined, all)).toBe('ko-meaning');
    expect(cardTypeFor(review(undefined, 'again', '2026-11-16'), all)).toBe('ko-meaning');
  });

  it('rotates through all four types as reviews go on', () => {
    const types = [0, 1, 2, 3].map((reps) => cardTypeFor({ ...learned, reps }, all));
    expect(types).toEqual(['ko-meaning', 'meaning-ko', 'listening', 'typing']);
  });

  it('skips listening without a voice and typing when switched off', () => {
    const none = { voice: false, typing: false };
    const types = [0, 1, 2, 3].map((reps) => cardTypeFor({ ...learned, reps }, none));
    expect(types).toEqual(['ko-meaning', 'meaning-ko', 'ko-meaning', 'meaning-ko']);
  });

  it('checks typed answers ignoring spaces', () => {
    expect(isTypedCorrect('안녕히가세요', '안녕히 가세요')).toBe(true);
    expect(isTypedCorrect(' 물 ', '물')).toBe(true);
    expect(isTypedCorrect('불', '물')).toBe(false);
    expect(isTypedCorrect('', '물')).toBe(false);
  });
});

describe('search', () => {
  it('finds words by Korean or by meaning', () => {
    expect(searchWords(WORDS, '도서관').map((w) => w.korean)).toContain('도서관');
    expect(searchWords(WORDS, 'Library').map((w) => w.korean)).toContain('도서관');
    expect(searchWords(WORDS, '  ')).toEqual([]);
  });
});

describe('number trainer', () => {
  it('builds valid questions in every mode', () => {
    for (const mode of NUMBER_MODES) {
      const session = buildNumberSession(mode, 20, seeded(4));
      expect(session).toHaveLength(20);
      for (const q of session) {
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        expect(q.options).toContain(q.answer);
        expect(q.speak).toMatch(/[가-힣]/);
      }
      expect(session[0]!.promptIsKorean).toBe(false);
      expect(session[1]!.promptIsKorean).toBe(true);
    }
  });
});
