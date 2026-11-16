import { describe, expect, it } from 'vitest';
import { addDays } from './date';
import { buildRoadmap, roadmapPosition, splitWeeks } from './roadmap';

const DEPARTURE = '2027-02-25';

describe('buildRoadmap', () => {
  it('gives 2 + 4 + 4 + 4 weeks from 16 November to 25 February', () => {
    const stages = buildRoadmap('2026-11-16', DEPARTURE);
    expect(stages.map((s) => [s.id, s.weeks])).toEqual([
      ['hangul', 2],
      ['core', 4],
      ['survival', 4],
      ['arrival', 4],
    ]);
    expect(stages[0]).toMatchObject({ start: '2026-11-16', end: '2026-11-29' });
    expect(stages[1]!.start).toBe('2026-11-30');
    expect(stages[3]!.end).toBe('2027-02-24'); // the day before departure
  });

  it('has no gaps or overlaps between stages', () => {
    for (const start of ['2026-11-16', '2026-12-20', '2027-01-25', '2027-02-10']) {
      const stages = buildRoadmap(start, DEPARTURE);
      stages.forEach((stage, i) => {
        expect(stage.start <= stage.end).toBe(true);
        if (i > 0) expect(stage.start).toBe(addDays(stages[i - 1]!.end, 1));
      });
      expect(stages[stages.length - 1]!.end).toBe('2027-02-24');
    }
  });

  it('still works with a late start', () => {
    expect(buildRoadmap('2027-01-28', DEPARTURE).map((s) => s.weeks)).toEqual([1, 1, 1, 1]); // 4 weeks
    expect(buildRoadmap('2027-02-04', DEPARTURE).map((s) => s.id)).toEqual([
      'hangul',
      'core',
      'survival',
    ]);
    expect(buildRoadmap('2027-02-11', DEPARTURE).map((s) => s.id)).toEqual(['hangul', 'survival']);
    expect(buildRoadmap('2027-02-22', DEPARTURE).map((s) => s.id)).toEqual(['hangul']);
    // Starting on or after departure never crashes.
    expect(buildRoadmap('2027-03-10', DEPARTURE)).toHaveLength(1);
  });

  it('always keeps at least one week per stage', () => {
    for (let weeks = 4; weeks <= 30; weeks++) {
      const split = splitWeeks(weeks);
      expect(split.reduce((sum, [, n]) => sum + n, 0)).toBe(weeks);
      for (const [, n] of split) expect(n).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('roadmapPosition', () => {
  const stages = buildRoadmap('2026-11-16', DEPARTURE);

  it('finds the stage and week for a date', () => {
    expect(roadmapPosition(stages, '2026-11-16', DEPARTURE)).toMatchObject({
      stageId: 'hangul',
      week: 1,
      totalWeeks: 14,
    });
    expect(roadmapPosition(stages, '2026-11-30', DEPARTURE)).toMatchObject({
      stageId: 'core',
      week: 3,
    });
    expect(roadmapPosition(stages, '2027-01-10', DEPARTURE)).toMatchObject({
      stageId: 'survival',
      week: 8,
    });
    expect(roadmapPosition(stages, '2027-02-24', DEPARTURE)).toMatchObject({
      stageId: 'arrival',
      week: 14,
    });
  });

  it('switches to "in Korea" from the departure day', () => {
    expect(roadmapPosition(stages, DEPARTURE, DEPARTURE).stageId).toBe('in-korea');
    expect(roadmapPosition(stages, '2027-05-01', DEPARTURE).stageId).toBe('in-korea');
  });
});
