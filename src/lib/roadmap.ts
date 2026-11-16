/** The study roadmap: weekly stages from the start date to departure. */
import { addDays, daysUntil, parseISODate, type ISODate } from './date';

export type StageId = 'hangul' | 'core' | 'survival' | 'arrival' | 'in-korea';

export interface Stage {
  id: StageId;
  title: string;
  focus: string;
  weeks: number;
  start: ISODate;
  /** Last day of the stage (inclusive). */
  end: ISODate;
}

const STAGE_TEXT: Record<StageId, { title: string; focus: string }> = {
  hangul: {
    title: 'Hangul',
    focus: 'Read and write every letter. Start the first vocabulary decks.',
  },
  core: {
    title: 'Core vocabulary and first grammar',
    focus: 'Daily word reviews, numbers, and simple polite sentences.',
  },
  survival: {
    title: 'Survival situations',
    focus: 'Ordering, shopping, transport, dorm and campus talk.',
  },
  arrival: {
    title: 'Review and arrival prep',
    focus: 'Strengthen weak spots, install the apps you need, get ready to land.',
  },
  'in-korea': {
    title: 'In Korea',
    focus: 'Keep the reviews going and use what you learned every day.',
  },
};

export const IN_KOREA: Omit<Stage, 'weeks' | 'start' | 'end'> = {
  id: 'in-korea',
  ...STAGE_TEXT['in-korea'],
};

/** How many weeks each stage gets. With a full 14 weeks this is 2, 4, 4, 4. */
export function splitWeeks(weeks: number): [StageId, number][] {
  if (weeks <= 1) return [['hangul', 1]];
  if (weeks === 2)
    return [
      ['hangul', 1],
      ['survival', 1],
    ];
  if (weeks === 3)
    return [
      ['hangul', 1],
      ['core', 1],
      ['survival', 1],
    ];
  const hangul = Math.max(1, Math.round(weeks * 0.15));
  let core = Math.max(1, Math.round(weeks * 0.3));
  let survival = Math.max(1, Math.round(weeks * 0.3));
  // Whatever is left is for review; always at least one week.
  while (weeks - hangul - core - survival < 1) {
    if (core >= survival) core--;
    else survival--;
  }
  return [
    ['hangul', hangul],
    ['core', core],
    ['survival', survival],
    ['arrival', weeks - hangul - core - survival],
  ];
}

function daysBetween(from: ISODate, to: ISODate): number {
  return daysUntil(to, parseISODate(from)!);
}

/** Builds the stages. Works for a late start: fewer weeks simply give shorter stages. */
export function buildRoadmap(start: ISODate, departure: ISODate): Stage[] {
  const days = Math.max(1, daysBetween(start, departure));
  const weeks = Math.max(1, Math.round(days / 7));
  const lastDay = addDays(departure, -1);
  const stages: Stage[] = [];
  let cursor = start;
  const split = splitWeeks(weeks);
  split.forEach(([id, stageWeeks], i) => {
    const isLast = i === split.length - 1;
    // The last stage always runs up to the day before departure.
    const naturalEnd = addDays(cursor, stageWeeks * 7 - 1);
    const end = isLast || naturalEnd > lastDay ? lastDay : naturalEnd;
    stages.push({ id, ...STAGE_TEXT[id], weeks: stageWeeks, start: cursor, end });
    cursor = addDays(end, 1);
  });
  return stages;
}

export interface RoadmapPosition {
  stageId: StageId;
  title: string;
  focus: string;
  /** 1-based week number since the start, and the number of weeks in the plan. */
  week: number;
  totalWeeks: number;
}

export function roadmapPosition(
  stages: Stage[],
  today: ISODate,
  departure: ISODate,
): RoadmapPosition {
  const totalWeeks = stages.reduce((sum, s) => sum + s.weeks, 0);
  const first = stages[0]!;
  if (today >= departure) {
    return { stageId: 'in-korea', ...STAGE_TEXT['in-korea'], week: totalWeeks, totalWeeks };
  }
  const stage = stages.find((s) => today <= s.end) ?? stages[stages.length - 1]!;
  const week = Math.min(
    totalWeeks,
    Math.max(1, Math.floor(daysBetween(first.start, today) / 7) + 1),
  );
  return { stageId: stage.id, title: stage.title, focus: stage.focus, week, totalWeeks };
}
