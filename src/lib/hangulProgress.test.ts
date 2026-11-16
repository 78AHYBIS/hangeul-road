import { describe, expect, it } from 'vitest';
import {
  EMPTY_HANGUL_PROGRESS,
  letterStatus,
  pickWeighted,
  recordLetterResults,
  sanitizeHangulProgress,
} from './hangulProgress';

const answer = (results: boolean[]) =>
  results.reduce((p, ok) => recordLetterResults(p, ['ㄱ'], ok), EMPTY_HANGUL_PROGRESS).letters[
    'ㄱ'
  ];

describe('letterStatus', () => {
  it('is new until the letter has been drilled', () => {
    expect(letterStatus(undefined)).toBe('new');
    expect(letterStatus({ seen: 0, correct: 0, recent: [] })).toBe('new');
  });

  it('is learning with few answers or low accuracy', () => {
    expect(letterStatus(answer([true, true, true]))).toBe('learning');
    expect(letterStatus(answer([true, false, true, false, true, true]))).toBe('learning');
  });

  it('is solid at 6+ recent answers with 85% right', () => {
    expect(letterStatus(answer(Array(6).fill(true)))).toBe('solid');
    expect(letterStatus(answer([false, ...Array(6).fill(true)]))).toBe('solid');
  });

  it('forgets old mistakes and notices new ones', () => {
    expect(letterStatus(answer([...Array(5).fill(false), ...Array(10).fill(true)]))).toBe('solid');
    expect(letterStatus(answer([...Array(10).fill(true), false, false]))).toBe('learning');
  });
});

describe('recordLetterResults', () => {
  it('counts answers and keeps only the last 10', () => {
    const stat = answer(Array(14).fill(true))!;
    expect(stat.seen).toBe(14);
    expect(stat.correct).toBe(14);
    expect(stat.recent).toHaveLength(10);
  });

  it('does not change the original object', () => {
    recordLetterResults(EMPTY_HANGUL_PROGRESS, ['ㄱ'], true);
    expect(EMPTY_HANGUL_PROGRESS.letters).toEqual({});
  });
});

describe('sanitizeHangulProgress', () => {
  it('returns empty progress for junk', () => {
    expect(sanitizeHangulProgress(null)).toEqual(EMPTY_HANGUL_PROGRESS);
    expect(sanitizeHangulProgress({ letters: 'x', readingSpeed: 3 })).toEqual(
      EMPTY_HANGUL_PROGRESS,
    );
  });

  it('repairs bad fields and keeps good ones', () => {
    const result = sanitizeHangulProgress({
      letters: { ㄱ: { seen: 3, correct: 9, recent: [true, 'x', false] }, ㄴ: 'bad' },
      readingSpeed: [
        { date: '2026-11-16', perMinute: 30, items: 15, seconds: 30 },
        { date: 'nope', perMinute: 1 },
      ],
      lessonsDone: ['a', 'a', 4],
    });
    expect(result.letters).toEqual({ ㄱ: { seen: 3, correct: 3, recent: [true, false] } });
    expect(result.readingSpeed).toHaveLength(1);
    expect(result.lessonsDone).toEqual(['a']);
  });
});

describe('pickWeighted', () => {
  it('follows the weights', () => {
    const items = ['a', 'b'];
    const weight = (x: string) => (x === 'a' ? 3 : 1);
    expect(pickWeighted(items, weight, () => 0)).toBe('a');
    expect(pickWeighted(items, weight, () => 0.74)).toBe('a');
    expect(pickWeighted(items, weight, () => 0.76)).toBe('b');
    expect(pickWeighted(items, weight, () => 0.999)).toBe('b');
  });
});
