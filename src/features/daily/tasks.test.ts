import { describe, expect, it } from 'vitest';
import { GRAMMAR_LESSONS } from '../../content/grammar';
import { LETTERS, LETTER_LESSONS, RULE_LESSONS } from '../../content/hangul';
import { PHRASE_PACKS } from '../../content/phrases';
import { EMPTY_DAY } from '../../lib/activity';
import { addDays } from '../../lib/date';
import {
  EMPTY_HANGUL_PROGRESS,
  recordLetterResults,
  type HangulProgress,
} from '../../lib/hangulProgress';
import {
  MAX_TASKS,
  buildPlan,
  dayIndex,
  isTaskDone,
  lessonTaskById,
  type PlanInput,
} from './tasks';

const base: PlanInput = {
  today: '2026-11-16',
  size: 'normal',
  sizePicked: false,
  stage: 'hangul',
  comeback: false,
  reviewsDue: 0,
  newWords: 10,
  hangul: EMPTY_HANGUL_PROGRESS,
  grammarDone: [],
  packsDone: [],
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
  it('moves from letter lessons to reading rules to grammar in the Hangul stage', () => {
    const lesson = (lessonsDone: string[]) =>
      buildPlan({ ...base, hangul: { ...EMPTY_HANGUL_PROGRESS, lessonsDone } }).tasks.find(
        (t) => t.kind === 'lesson',
      )!.id;
    const letters = LETTER_LESSONS.map((l) => l.id);
    expect(lesson([letters[0]!])).toBe(`lesson:${letters[1]}`);
    expect(lesson(letters)).toBe('lesson:hangul-rule-batchim');
    expect(lesson([...letters, ...RULE_LESSONS.map((r) => r.id)])).toBe(
      'lesson:grammar-01-word-order',
    );
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

describe('active course from the Library', () => {
  const unitTask = {
    id: 'course:res-gobilly-youtube:u3',
    title: 'GO! Billy Korean (YouTube): Lesson 3',
    detail: '22 units left.',
    to: '/library/res-gobilly-youtube',
    done: false,
    unit: { resourceId: 'res-gobilly-youtube', unitId: 'u3' },
  };

  it('replaces the Duolingo task with the next unit of the active course', () => {
    const without = buildPlan(base).tasks.at(-1)!;
    expect(without.id).toBe('external:duolingo');

    const withCourse = buildPlan({ ...base, external: unitTask }).tasks.at(-1)!;
    expect(withCourse).toMatchObject({
      id: 'external:course:res-gobilly-youtube:u3',
      kind: 'external',
      title: 'GO! Billy Korean (YouTube): Lesson 3',
      to: '/library/res-gobilly-youtube',
      unit: { resourceId: 'res-gobilly-youtube', unitId: 'u3' },
    });
  });

  it('counts the course task as done when its unit was ticked today', () => {
    const open = { ...base, external: unitTask };
    const task = buildPlan(open).tasks.at(-1)!;
    expect(isTaskDone(task, open)).toBe(false);
    const ticked = { ...base, external: { ...unitTask, done: true } };
    expect(isTaskDone(task, ticked)).toBe(true);
  });
});

describe('grammar and phrases in the plan (Phase 5)', () => {
  const letters = LETTER_LESSONS.map((l) => l.id);
  const rules = RULE_LESSONS.map((r) => r.id);
  const grammarIds = GRAMMAR_LESSONS.map((l) => l.id);
  const packIds = PHRASE_PACKS.map((p) => p.id);
  const lessonOf = (input: Partial<PlanInput>) =>
    buildPlan({ ...base, ...input }).tasks.find((t) => t.kind === 'lesson')!;
  const hangulDone = (extra: string[] = []) => ({
    ...EMPTY_HANGUL_PROGRESS,
    lessonsDone: [...letters, ...extra],
  });
  // Two days next to each other, so the survival stage shows both of its turns.
  const even = (() => {
    let d = '2027-01-04';
    while (dayIndex(d) % 2 !== 0) d = addDays(d, 1);
    return d;
  })();
  const odd = addDays(even, 1);

  it('always starts with the letter lessons, whatever the stage', () => {
    for (const stage of ['core', 'survival', 'arrival'] as const) {
      expect(lessonOf({ stage }).id).toBe('lesson:hangul-lesson-basic-vowels');
    }
  });

  it('gives grammar first in the core stage, before the remaining reading rules', () => {
    expect(lessonOf({ stage: 'core', hangul: hangulDone() }).id).toBe(
      'lesson:grammar-01-word-order',
    );
    const next = lessonOf({ stage: 'core', hangul: hangulDone(), grammarDone: grammarIds });
    expect(next.id).toBe(`lesson:${rules[0]}`);
    const after = lessonOf({
      stage: 'core',
      hangul: hangulDone(rules),
      grammarDone: grammarIds.slice(0, 3),
    });
    expect(after.id).toBe(`lesson:${grammarIds[3]}`);
    expect(after.to).toBe(`/learn/grammar/${grammarIds[3]}`);
  });

  it('alternates phrase packs and grammar day by day in the survival stage', () => {
    const input = { stage: 'survival' as const, hangul: hangulDone(rules) };
    expect(lessonOf({ ...input, today: even }).id).toBe(`lesson:${packIds[0]}`);
    expect(lessonOf({ ...input, today: odd }).id).toBe(`lesson:${grammarIds[0]}`);
    // With all grammar done, every day is a phrase pack.
    expect(lessonOf({ ...input, today: odd, grammarDone: grammarIds }).id).toBe(
      `lesson:${packIds[0]}`,
    );
  });

  it('puts the remaining phrase packs first in the arrival stage', () => {
    const t = lessonOf({
      stage: 'arrival',
      hangul: hangulDone(rules),
      packsDone: packIds.slice(0, 5),
    });
    expect(t.id).toBe(`lesson:${packIds[5]}`);
    expect(t.to).toBe(`/learn/phrases/${packIds[5]}`);
  });

  it('falls back to the number trainer only when every lesson is finished', () => {
    const t = lessonOf({
      stage: 'arrival',
      hangul: hangulDone(rules),
      grammarDone: grammarIds,
      packsDone: packIds,
    });
    expect(t.id).toMatch(/^lesson:numbers-/);
  });

  it('keeps a lesson finished today in place, ticked, instead of showing the next one', () => {
    const input: PlanInput = {
      ...base,
      stage: 'core',
      hangul: hangulDone(rules),
      grammarDone: [grammarIds[0]!],
      dayLog: { ...EMPTY_DAY, tasksDone: [`lesson:${grammarIds[0]}`] },
    };
    const plan = buildPlan(input);
    const lesson = plan.tasks.find((t) => t.kind === 'lesson')!;
    expect(lesson.id).toBe(`lesson:${grammarIds[0]}`);
    expect(isTaskDone(lesson, input)).toBe(true);
    // Tomorrow the next lesson appears.
    const tomorrow = buildPlan({ ...input, today: addDays(input.today, 1), dayLog: undefined });
    expect(tomorrow.tasks.find((t) => t.kind === 'lesson')!.id).toBe(`lesson:${grammarIds[1]}`);
  });

  it('detects finished grammar lessons and phrase packs', () => {
    const input = { ...base, stage: 'survival' as const, hangul: hangulDone(rules) };
    const grammarTask = lessonTaskById(`lesson:${grammarIds[2]}`)!;
    const packTask = lessonTaskById(`lesson:${packIds[2]}`)!;
    expect(isTaskDone(grammarTask, input)).toBe(false);
    expect(isTaskDone(grammarTask, { ...input, grammarDone: [grammarIds[2]!] })).toBe(true);
    expect(isTaskDone(packTask, { ...input, packsDone: [packIds[2]!] })).toBe(true);
    expect(lessonTaskById('lesson:numbers-price')!.title).toMatch(/Numbers/);
    expect(lessonTaskById('lesson:nope')).toBeNull();
  });

  it('adds grammar practice and phrase quizzes to the drill once letters are solid', () => {
    const drills = new Set(
      [0, 1, 2, 3, 4, 5].map(
        (n) =>
          buildPlan({
            ...base,
            today: addDays(base.today, n),
            hangul: mastered(),
            grammarDone: grammarIds.slice(0, 4),
            packsDone: packIds.slice(0, 2),
            weakGrammar: grammarIds[1],
            weakPack: packIds[0],
          }).tasks.find((t) => t.kind === 'drill')!.id,
      ),
    );
    expect(drills).toContain(`drill:grammar:${grammarIds[1]}`);
    expect(drills).toContain(`drill:quiz:${packIds[0]}`);
    // Letters still weak: the drill stays on letters.
    const weakLetters = buildPlan({ ...base, weakGrammar: grammarIds[0] });
    expect(weakLetters.tasks.find((t) => t.kind === 'drill')!.id).not.toMatch(/grammar/);
  });

  it('keeps a practice drill done today in place', () => {
    const input: PlanInput = {
      ...base,
      hangul: mastered(),
      weakGrammar: grammarIds[5],
      dayLog: { ...EMPTY_DAY, tasksDone: [`drill:grammar:${grammarIds[1]}`] },
    };
    const drill = buildPlan(input).tasks.find((t) => t.kind === 'drill')!;
    expect(drill.id).toBe(`drill:grammar:${grammarIds[1]}`);
    expect(isTaskDone(drill, input)).toBe(true);
  });
});
