import { describe, expect, it } from 'vitest';
import {
  EMPTY_GRAMMAR_PROGRESS,
  addDone,
  sanitizeGrammarProgress,
  weakest,
} from './grammarProgress';
import { EMPTY_PHRASE_PROGRESS, sanitizePhraseProgress, toggleStar } from './phraseProgress';

describe('grammar progress', () => {
  it('sanitizes junk to empty progress', () => {
    expect(sanitizeGrammarProgress(undefined)).toEqual(EMPTY_GRAMMAR_PROGRESS);
    expect(
      sanitizeGrammarProgress({
        done: ['a', 'a', 3, ''],
        results: {
          a: { correct: 9, total: 6, date: '2026-11-17' },
          b: { correct: 1, total: 0, date: '2026-11-17' },
          c: { correct: 1, total: 2, date: 'yesterday' },
        },
      }),
    ).toEqual({ done: ['a'], results: { a: { correct: 6, total: 6, date: '2026-11-17' } } });
  });

  it('adds done ids once', () => {
    expect(addDone(['a'], 'a')).toEqual(['a']);
    expect(addDone(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('finds the weakest finished item to practise', () => {
    const results = {
      a: { correct: 6, total: 6, date: '2026-11-10' },
      b: { correct: 3, total: 6, date: '2026-11-12' },
      c: { correct: 3, total: 6, date: '2026-11-11' },
    };
    expect(weakest([], results)).toBeNull();
    expect(weakest(['a', 'b', 'c'], results)).toBe('c'); // same score, practised longer ago
    expect(weakest(['a', 'b', 'd'], results)).toBe('d'); // never practised counts as 0%
  });
});

describe('phrase progress', () => {
  it('sanitizes and toggles stars', () => {
    expect(sanitizePhraseProgress('x')).toEqual(EMPTY_PHRASE_PROGRESS);
    const once = toggleStar(EMPTY_PHRASE_PROGRESS, 'p1');
    expect(once.starred).toEqual(['p1']);
    expect(toggleStar(once, 'p1').starred).toEqual([]);
  });
});
