import { describe, expect, it } from 'vitest';
import { LETTERS, LETTER_LESSONS, RULE_LESSONS } from '../../content/hangul';
import { EMPTY_DAY } from '../../lib/activity';
import { addDays } from '../../lib/date';
import {
  EMPTY_HANGUL_PROGRESS,
  recordLetterResults,
  type HangulProgress,
} from '../../lib/hangulProgress';
import { MAX_TASKS, buildPlan, isTaskDone, type PlanInput } from './tasks';

const base: PlanInput = {
  today: '2026-11-16',
  size: 'normal',
  sizePicked: false,
  stage: 'hangul',
  comeback: false,
  reviewsDue: 0,
  newWords: 10,
  hangul: EMPTY_HANGUL_PROGRESS,
  dayLog: undefined,
};

/** Hangul fully learned: every lesson done and every letter solid. */
function mastered(): HangulProgress {
  let progress: HangulProgress = {
    ...EMPTY_HANGUL_PROGRESS,
    lessonsDone: [...LETTER_LESSONS, ...RULE_LESSONS].map((l) => l.id),
  };
  for (const letter of LETTERS) {
    for (let i = 0; i < 6; i++) progress = recordLetterResults(progress, [letter.korean], true);
  }
  return progress;
}

const kinds = (input: PlanInput) => buildPlan(input).tasks.map((t) => t.kind);

describe('buildPlan: day sizes', () => {
  it('is useful on day 1: new words, the first Hangul lesson, a drill and Duolingo', () => {
    const plan = buildPlan(base);
    expect(plan.tasks.map((t) => t.id)).toEqual([
      'reviews',
      'lesson:hangul-lesson-basic-vowels',
      'drill:' + plan.tasks[2]!.id.split(':')[1],
      'external:duolingo',
    ]);
    expect(plan.tasks[0]!.title).toBe('Learn 10 new words');
    expect(plan.minutes).toBeGreaterThanOrEqual(15);
    expect(plan.minutes).toBeLessThanOrEqual(30);
  });

  it('gives only reviews on a minimum day', () => {
    expect(kinds({ ...base, size: 'minimum', reviewsDue: 12 })).toEqual(['reviews']);
  });

  it('gives one short drill on a minimum day with nothing to review', () => {
    expect(kinds({ ...base, size: 'minimum', newWords: 0 })).toEqual(['drill']);
  });

  it('adds an extra drill on an intense day, keeping the external task last', () => {
    const plan = buildPlan({ ...base, size: 'intense', reviewsDue: 20 });
    expect(plan.tasks).toHaveLength(5);
    expect(plan.tasks[3]!.id).toBe('drill:timed-extra');
    expect(plan.tasks[4]!.kind).toBe('external');
  });

  it('never has more than five tasks, even with every source available', () => {
    for (const size of ['minimum', 'normal', 'intense'] as const) {
      const plan = buildPlan({
        ...base,
        size,
        reviewsDue: 300,
        culture: { id: 'c1', title: 'Culture card', detail: '' },
        external: { id: 'course', title: 'TTMIK lesson 3', detail: '' },
      });
      expect(plan.tasks.length).toBeLessThanOrEqual(MAX_TASKS);
      expect(new Set(plan.tasks.map((t) => t.id)).size).toBe(plan.tasks.length);
    }
    const full = buildPlan({
      ...base,
      size: 'normal',
      reviewsDue: 5,
      culture: { id: 'c1', title: 'Culture card', detail: '' },
      external: { id: 'course', title: 'TTMIK lesson 3', detail: '' },
    });
    expect(full.tasks.map((t) => t.kind)).toEqual([
      'reviews',
      'lesson',
      'drill',
      'culture',
      'external',
    ]);
    expect(full.tasks[4]!.title).toBe('TTMIK lesson 3');
  });
});

describe('buildPlan: missed days and late start', () => {
  it('plans a lighter day after a break, unless a size was picked by hand', () => {
    const back = { ...base, comeback: true, reviewsDue: 50 };
    expect(buildPlan(back)).toMatchObject({ size: 'minimum' });
    expect(kinds(back)).toEqual(['reviews']);
    expect(buildPlan({ ...back, size: 'normal', sizePicked: true }).size).toBe('normal');
  });

  it('never carries yesterday’s unfinished tasks into today', () => {
    // Day 1: nothing gets done. Day 2 with the same state is not longer than day 1.
    const day1 = buildPlan(base);
    const day2 = buildPlan({ ...base, today: addDays(base.today, 1) });
    expect(day2.tasks.length).toBe(day1.tasks.length);
    expect(day2.tasks.filter((t) => t.kind === 'lesson')).toHaveLength(1);
    // After a missed week the review task is one task, not seven.
    const afterWeek = buildPlan({ ...base, today: addDays(base.today, 8), reviewsDue: 50 });
    expect(afterWeek.tasks.filter((t) => t.kind === 'reviews')).toHaveLength(1);
    expect(afterWeek.tasks.length).toBeLessThanOrEqual(MAX_TASKS);
  });

  it('gives the same first lesson on a late start, whatever the stage', () => {
    for (const stage of ['hangul', 'core', 'survival', 'arrival'] as const) {
      const plan = buildPlan({ ...base, today: '2027-02-01', stage });
      expect(plan.tasks.find((t) => t.kind === 'lesson')!.id).toBe(
        'lesson:hangul-lesson-basic-vowels',
      );
    }
  });
});

describe('buildPlan: progress through the content', () => {
  it('moves from letter lessons to reading rules to numbers', () => {
    const lesson = (lessonsDone: string[]) =>
      buildPlan({ ...base, hangul: { ...EMPTY_HANGUL_PROGRESS, lessonsDone } }).tasks.find(
        (t) => t.kind === 'lesson',
      )!.id;
    const letters = LETTER_LESSONS.map((l) => l.id);
    expect(lesson([letters[0]!])).toBe(`lesson:${letters[1]}`);
    expect(lesson(letters)).toBe('lesson:hangul-rule-batchim');
    expect(lesson([...letters, ...RULE_LESSONS.map((r) => r.id)])).toMatch(/^lesson:numbers-/);
  });

  it('is still useful on day 100: reviews, numbers, a reading drill and the external task', () => {
    const plan = buildPlan({
      ...base,
      today: addDays(base.today, 100),
      stage: 'arrival',
      reviewsDue: 40,
      newWords: 10,
      hangul: mastered(),
    });
    expect(plan.tasks.map((t) => t.kind)).toEqual(['reviews', 'lesson', 'drill', 'external']);
    expect(plan.tasks[2]!.detail).toMatch(/All letters are solid/);
    expect(plan.tasks[0]!.title).toBe('Review 40 words');
  });

  it('rotates the drill from day to day', () => {
    const ids = new Set(
      [0, 1, 2, 3].map((n) => buildPlan({ ...base, today: addDays(base.today, n) }).tasks[2]!.id),
    );
    expect(ids.size).toBe(4);
  });
});

describe('isTaskDone', () => {
  const plan = buildPlan({ ...base, reviewsDue: 5 });
  const [reviews, lesson, , external] = plan.tasks;

  it('detects finished reviews and lessons, and respects manual ticks', () => {
    expect(isTaskDone(reviews!, base)).toBe(false);
    const finished = { ...base, reviewsDue: 0, newWords: 0, dayLog: { ...EMPTY_DAY, reviews: 15 } };
    expect(isTaskDone(reviews!, finished)).toBe(true);
    expect(buildPlan(finished).tasks[0]).toMatchObject({
      id: 'reviews',
      detail: 'All done for today.',
    });

    expect(isTaskDone(lesson!, base)).toBe(false);
    const learned = {
      ...base,
      hangul: { ...EMPTY_HANGUL_PROGRESS, lessonsDone: ['hangul-lesson-basic-vowels'] },
    };
    expect(isTaskDone(lesson!, learned)).toBe(true);

    expect(isTaskDone(external!, base)).toBe(false);
    const ticked = { ...base, dayLog: { ...EMPTY_DAY, tasksDone: ['external:duolingo'] } };
    expect(isTaskDone(external!, ticked)).toBe(true);
  });
});
