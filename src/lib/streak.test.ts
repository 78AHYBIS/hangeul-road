import { describe, expect, it } from 'vitest';
import { EMPTY_DAY, isStudied, levelOf, sanitizeActivity, totals, xpOf } from './activity';
import { addDays } from './date';
import { computeStreak, weekStart } from './streak';

// 2026-11-16 is a Monday.
const MON = '2026-11-16';
const days = (...offsets: number[]) => offsets.map((n) => addDays(MON, n));

describe('weekStart', () => {
  it('returns the Monday of the week', () => {
    expect(weekStart('2026-11-16')).toBe('2026-11-16');
    expect(weekStart('2026-11-22')).toBe('2026-11-16'); // Sunday
    expect(weekStart('2026-11-23')).toBe('2026-11-23');
  });
});

describe('computeStreak', () => {
  it('is zero with no history, and not a comeback', () => {
    expect(computeStreak([], MON)).toMatchObject({
      current: 0,
      comeback: false,
      daysSinceLast: null,
    });
  });

  it('counts consecutive days including today', () => {
    expect(computeStreak(days(0, 1, 2), addDays(MON, 2))).toMatchObject({
      current: 3,
      studiedToday: true,
      restDaysUsed: 0,
    });
  });

  it('does not break while today is still open', () => {
    expect(computeStreak(days(0, 1, 2), addDays(MON, 3))).toMatchObject({
      current: 3,
      studiedToday: false,
    });
  });

  it('forgives one missed day per week', () => {
    // Mon Tue, miss Wed, Thu Fri
    expect(computeStreak(days(0, 1, 3, 4), addDays(MON, 4))).toMatchObject({
      current: 4,
      restDaysUsed: 1,
    });
  });

  it('ends on a second missed day in the same week', () => {
    // Mon, miss Tue and Wed, Thu Fri
    expect(computeStreak(days(0, 3, 4), addDays(MON, 4)).current).toBe(2);
  });

  it('gives a new rest day in the next week', () => {
    // miss Wed (week 1) and Tue (week 2)
    const studied = days(0, 1, 3, 4, 5, 6, 7, 9, 10);
    expect(computeStreak(studied, addDays(MON, 10))).toMatchObject({ current: 9, restDaysUsed: 2 });
  });

  it('flags a comeback after three or more missed days, for the whole first day back', () => {
    const friday = addDays(MON, 4); // last studied Monday: Tue, Wed, Thu missed
    expect(computeStreak(days(0), friday)).toMatchObject({
      comeback: true,
      daysSinceLast: 4,
      current: 0,
    });
    // Still a comeback after studying today, so the lighter plan does not change mid-day.
    expect(computeStreak(days(0, 4), friday)).toMatchObject({ comeback: true, current: 1 });
    expect(computeStreak(days(0), addDays(MON, 3)).comeback).toBe(false);
    // The next day it is a normal day again.
    expect(computeStreak(days(0, 4), addDays(MON, 5)).comeback).toBe(false);
  });
});

describe('activity', () => {
  it('counts a day as studied with one task or five answers', () => {
    expect(isStudied(undefined)).toBe(false);
    expect(isStudied({ ...EMPTY_DAY, reviews: 4 })).toBe(false);
    expect(isStudied({ ...EMPTY_DAY, reviews: 3, answers: 2 })).toBe(true);
    expect(isStudied({ ...EMPTY_DAY, tasksDone: ['external:duolingo'] })).toBe(true);
  });

  it('sums a date range and computes accuracy', () => {
    const activity = sanitizeActivity({
      days: {
        '2026-11-16': { reviews: 10, reviewsCorrect: 8, newWords: 5, seconds: 300 },
        '2026-11-17': { answers: 10, correct: 7, seconds: 100, tasksDone: ['a', 'a'] },
        'bad-date': { reviews: 99 },
      },
    });
    expect(totals(activity)).toMatchObject({
      daysStudied: 2,
      reviews: 10,
      newWords: 5,
      answers: 10,
      seconds: 400,
    });
    expect(totals(activity).accuracy).toBeCloseTo(0.75);
    expect(totals(activity, '2026-11-17', '2026-11-17').reviews).toBe(0);
    expect(totals(sanitizeActivity(null)).accuracy).toBeNull();
    expect(xpOf(activity)).toBe(10 + 10 + 10);
    expect(levelOf(0)).toEqual({ level: 1, next: 50 });
    expect(levelOf(200)).toEqual({ level: 3, next: 450 });
  });
});
