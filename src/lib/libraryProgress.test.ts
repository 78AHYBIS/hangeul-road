import { describe, expect, it } from 'vitest';
import {
  EMPTY_LIBRARY,
  MAX_ACTIVE,
  addCustom,
  addUnits,
  courseTaskForToday,
  numberedTitles,
  removeCustom,
  removeUnit,
  sanitizeLibrary,
  setStatus,
  stateOf,
  toggleActive,
  toggleUnit,
  unitForToday,
  type LibraryProgress,
} from './libraryProgress';

const TODAY = '2026-11-17';
const YESTERDAY = '2026-11-16';
const names: Record<string, string> = { a: 'Course A', b: 'Course B', c: 'Course C' };
const nameOf = (id: string) => names[id];

/** Course `a` active, with three lessons. */
function withCourse(): LibraryProgress {
  return addUnits(toggleActive(EMPTY_LIBRARY, 'a'), 'a', ['Lesson 1', 'Lesson 2', 'Lesson 3']);
}

describe('sanitizeLibrary', () => {
  it('returns an empty library for junk', () => {
    expect(sanitizeLibrary(undefined)).toEqual(EMPTY_LIBRARY);
    expect(sanitizeLibrary('x')).toEqual(EMPTY_LIBRARY);
    expect(sanitizeLibrary([])).toEqual(EMPTY_LIBRARY);
  });

  it('keeps valid data and repairs bad fields', () => {
    const lib = sanitizeLibrary({
      items: {
        a: {
          status: 'in-progress',
          notes: '  hi  ',
          units: [
            { id: 'u1', title: 'One', doneOn: TODAY },
            { id: 'u1', title: 'Duplicate', doneOn: null },
            { id: 'u2', title: '', doneOn: null },
            { id: 'u3', title: 'Three', doneOn: 'not a date' },
          ],
        },
        b: { status: 'weird' },
        c: 'junk',
      },
      active: ['a', 'a', 'b', 'c', 5],
      custom: [
        { id: 'custom-1', name: 'Mine', type: 'nope', url: 'javascript:alert(1)', skills: ['x'] },
        { id: 'res-not-custom', name: 'Bad id' },
        { id: 'custom-2', name: '' },
      ],
    });
    expect(lib.items.a).toEqual({
      status: 'in-progress',
      notes: 'hi',
      units: [
        { id: 'u1', title: 'One', doneOn: TODAY },
        { id: 'u3', title: 'Three', doneOn: null },
      ],
    });
    expect(lib.items.b!.status).toBe('not-started');
    expect(lib.items.c).toBeUndefined();
    expect(lib.active).toEqual(['a', 'b']);
    expect(lib.custom).toEqual([
      {
        id: 'custom-1',
        name: 'Mine',
        type: 'website',
        url: '',
        description: '',
        skills: [],
        cost: 'free',
      },
    ]);
  });
});

describe('status and active courses', () => {
  it('making a course active marks it in progress', () => {
    const lib = toggleActive(EMPTY_LIBRARY, 'a');
    expect(lib.active).toEqual(['a']);
    expect(stateOf(lib, 'a').status).toBe('in-progress');
    expect(toggleActive(lib, 'a').active).toEqual([]);
  });

  it(`allows at most ${MAX_ACTIVE} active courses`, () => {
    const two = toggleActive(toggleActive(EMPTY_LIBRARY, 'a'), 'b');
    expect(toggleActive(two, 'c')).toBe(two);
  });

  it('finishing or dropping a course stops it being active', () => {
    const lib = toggleActive(EMPTY_LIBRARY, 'a');
    expect(setStatus(lib, 'a', 'finished').active).toEqual([]);
    expect(setStatus(lib, 'a', 'dropped').active).toEqual([]);
    expect(setStatus(lib, 'a', 'in-progress').active).toEqual(['a']);
  });
});

describe('units', () => {
  it('adds units with new ids, skipping blank lines', () => {
    let lib = addUnits(EMPTY_LIBRARY, 'a', ['One', '  ', 'Two']);
    expect(stateOf(lib, 'a').units.map((u) => u.id)).toEqual(['u1', 'u2']);
    lib = removeUnit(lib, 'a', 'u2');
    lib = addUnits(lib, 'a', ['Three']);
    // New ids continue after the highest id still present.
    expect(stateOf(lib, 'a').units.map((u) => `${u.id}:${u.title}`)).toEqual([
      'u1:One',
      'u2:Three',
    ]);
  });

  it('numbers units from a starting point', () => {
    expect(numberedTitles('Lesson', 3, 4)).toEqual(['Lesson 4', 'Lesson 5', 'Lesson 6']);
    expect(numberedTitles('  ', 1)).toEqual(['Unit 1']);
    expect(numberedTitles('X', -2)).toEqual([]);
  });

  it('ticks and unticks a unit with the date', () => {
    let lib = withCourse();
    lib = toggleUnit(lib, 'a', 'u1', TODAY);
    expect(stateOf(lib, 'a').units[0]!.doneOn).toBe(TODAY);
    lib = toggleUnit(lib, 'a', 'u1', TODAY);
    expect(stateOf(lib, 'a').units[0]!.doneOn).toBeNull();
  });

  it("today's unit stays put after it is ticked today", () => {
    let lib = withCourse();
    lib = toggleUnit(lib, 'a', 'u1', YESTERDAY);
    expect(unitForToday(stateOf(lib, 'a'), TODAY)!.id).toBe('u2');
    lib = toggleUnit(lib, 'a', 'u2', TODAY);
    expect(unitForToday(stateOf(lib, 'a'), TODAY)!.id).toBe('u2');
    // The next day, the following unit comes up.
    expect(unitForToday(stateOf(lib, 'a'), '2026-11-18')!.id).toBe('u3');
  });
});

describe('courseTaskForToday', () => {
  it('is null with no active course, so Today falls back to Duolingo', () => {
    expect(courseTaskForToday(EMPTY_LIBRARY, nameOf, TODAY, 0)).toBeNull();
  });

  it('suggests the next unit of the active course', () => {
    const task = courseTaskForToday(withCourse(), nameOf, TODAY, 0)!;
    expect(task).toMatchObject({
      id: 'course:a:u1',
      title: 'Course A: Lesson 1',
      detail: '3 units left.',
      to: '/library/a',
      done: false,
      unit: { resourceId: 'a', unitId: 'u1' },
    });
  });

  it('shows the unit as done when it was ticked today', () => {
    const lib = toggleUnit(withCourse(), 'a', 'u1', TODAY);
    expect(courseTaskForToday(lib, nameOf, TODAY, 0)).toMatchObject({
      id: 'course:a:u1',
      done: true,
    });
  });

  it('reminds to add units when an active course has none', () => {
    const lib = toggleActive(EMPTY_LIBRARY, 'a');
    expect(courseTaskForToday(lib, nameOf, TODAY, 0)).toMatchObject({
      id: 'course:a',
      title: 'Continue Course A',
    });
  });

  it('skips a course whose units were all done before today', () => {
    let lib = addUnits(toggleActive(EMPTY_LIBRARY, 'a'), 'a', ['Only']);
    lib = toggleUnit(lib, 'a', 'u1', YESTERDAY);
    expect(courseTaskForToday(lib, nameOf, TODAY, 0)).toBeNull();
  });

  it('alternates between two active courses by day', () => {
    let lib = withCourse();
    lib = addUnits(toggleActive(lib, 'b'), 'b', ['Video 1']);
    expect(courseTaskForToday(lib, nameOf, TODAY, 10)!.id).toBe('course:a:u1');
    expect(courseTaskForToday(lib, nameOf, TODAY, 11)!.id).toBe('course:b:u1');
  });

  it('ignores an active id that no longer exists', () => {
    const lib = toggleActive(EMPTY_LIBRARY, 'gone');
    expect(courseTaskForToday(lib, nameOf, TODAY, 0)).toBeNull();
  });
});

describe('custom resources', () => {
  it('adds and removes a resource with its state', () => {
    let lib = addCustom(EMPTY_LIBRARY, {
      id: 'custom-x',
      name: 'My tutor',
      type: 'tutor',
      url: 'https://example.com',
      description: '',
      skills: ['speaking'],
      cost: 'paid',
    });
    lib = toggleActive(lib, 'custom-x');
    expect(lib.custom).toHaveLength(1);
    lib = removeCustom(lib, 'custom-x');
    expect(lib).toEqual(EMPTY_LIBRARY);
  });
});
