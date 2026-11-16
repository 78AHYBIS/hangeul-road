import { describe, expect, it } from 'vitest';
import { sanitizeActivity } from '../../lib/activity';
import { EMPTY_HANGUL_PROGRESS, recordLetterResults } from '../../lib/hangulProgress';
import { review } from '../../lib/srs';
import { hardestWords, weakestLetters, weekSummary } from './weekly';

const TODAY = '2026-11-22';

describe('weekly review', () => {
  it('sums only the last seven days', () => {
    const activity = sanitizeActivity({
      days: {
        '2026-11-15': { reviews: 50, reviewsCorrect: 50 }, // eight days ago: outside
        '2026-11-16': { reviews: 10, reviewsCorrect: 9, newWords: 10 },
        '2026-11-22': { answers: 10, correct: 6 },
      },
    });
    const summary = weekSummary(activity, EMPTY_HANGUL_PROGRESS, {}, TODAY);
    expect(summary.from).toBe('2026-11-16');
    expect(summary.totals).toMatchObject({
      daysStudied: 2,
      reviews: 10,
      newWords: 10,
      answers: 10,
    });
    expect(summary.totals.accuracy).toBeCloseTo(0.75);
  });

  it('lists the weakest letters, worst first, and skips strong ones', () => {
    let hangul = EMPTY_HANGUL_PROGRESS;
    for (const ok of [true, true, true, true]) hangul = recordLetterResults(hangul, ['ㅏ'], ok);
    for (const ok of [false, false, true]) hangul = recordLetterResults(hangul, ['ㅓ'], ok);
    for (const ok of [true, false]) hangul = recordLetterResults(hangul, ['ㅗ'], ok);
    expect(weakestLetters(hangul).map((l) => l.jamo)).toEqual(['ㅓ', 'ㅗ']);
  });

  it('lists the words forgotten most often', () => {
    const learned = review(review(undefined, 'good', TODAY), 'good', TODAY);
    const once = review(learned, 'again', TODAY);
    const twice = review(review(once, 'good', TODAY), 'again', TODAY);
    expect(hardestWords({ a: learned, b: once, c: twice })).toEqual(['c', 'b']);
  });

  it('suggests one focus that fits the week', () => {
    const none = weekSummary(sanitizeActivity(null), EMPTY_HANGUL_PROGRESS, {}, TODAY);
    expect(none.focus).toMatch(/Start small/);
    const few = sanitizeActivity({ days: { '2026-11-20': { reviews: 10, reviewsCorrect: 10 } } });
    expect(weekSummary(few, EMPTY_HANGUL_PROGRESS, {}, TODAY).focus).toMatch(/more days/);
    const days = Object.fromEntries(
      [16, 17, 18, 19, 20].map((d) => [`2026-11-${d}`, { reviews: 10, reviewsCorrect: 10 }]),
    );
    const steady = sanitizeActivity({ days });
    expect(weekSummary(steady, EMPTY_HANGUL_PROGRESS, {}, TODAY).focus).toMatch(/Basic vowels/);
  });
});
