/**
 * Builds today's task list (at most 5). Pure logic: everything it needs is passed in,
 * so the same inputs always give the same plan.
 *
 * Nothing is carried over: the plan is rebuilt from the current state every day,
 * and yesterday's unticked tasks are simply gone.
 */
import { LETTERS, LETTER_LESSONS, RULE_LESSONS } from '../../content/hangul';
import type { DayLog } from '../../lib/activity';
import { parseISODate, type ISODate } from '../../lib/date';
import { letterStatus, type HangulProgress } from '../../lib/hangulProgress';
import type { StageId } from '../../lib/roadmap';
import type { DailyGoal } from '../../lib/storage/schema';
import { NUMBER_MODES, NUMBER_MODE_INFO } from '../vocab/numberDrill';
import { DRILL_INFO, drillPool, type DrillType } from '../hangul/drills';

export const MAX_TASKS = 5;

export type TaskKind = 'reviews' | 'lesson' | 'drill' | 'culture' | 'external';

export interface Task {
  /** Stable for the day; stored in the day log when ticked. */
  id: string;
  kind: TaskKind;
  title: string;
  detail: string;
  /** Where the task is done in the app, if anywhere. */
  to?: string;
  minutes: number;
}

/** A task supplied by another part of the app (culture cards, active course). */
export interface ExtraTask {
  id: string;
  title: string;
  detail: string;
  to?: string;
}

export interface PlanInput {
  today: ISODate;
  /** Size from settings, or the one picked for today. */
  size: DailyGoal;
  /** True if the size was picked by hand today (it then wins over the comeback rule). */
  sizePicked: boolean;
  stage: StageId;
  /** Back after 3+ missed days: plan a lighter day. */
  comeback: boolean;
  reviewsDue: number;
  newWords: number;
  hangul: HangulProgress;
  dayLog: DayLog | undefined;
  /** Phase 6 passes today's culture card here. */
  culture?: ExtraTask | null;
  /** Phase 4 passes the next unit of the active course; otherwise Duolingo is used. */
  external?: ExtraTask | null;
}

export interface Plan {
  size: DailyGoal;
  tasks: Task[];
  minutes: number;
}

const DUOLINGO: ExtraTask = {
  id: 'duolingo',
  title: 'Duolingo done',
  detail: 'Tick this after today’s Duolingo lesson.',
};

/** A different whole number every day, used to rotate between options. */
function dayIndex(date: ISODate): number {
  const d = parseISODate(date)!;
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

function reviewsTask(input: PlanInput): Task | null {
  const total = input.reviewsDue + input.newWords;
  const doneToday = input.dayLog?.reviews ?? 0;
  if (total === 0 && doneToday === 0) return null;
  const title =
    total === 0
      ? 'Word reviews'
      : input.reviewsDue > 0
        ? `Review ${input.reviewsDue} ${input.reviewsDue === 1 ? 'word' : 'words'}`
        : `Learn ${input.newWords} new words`;
  const detail =
    total === 0
      ? 'All done for today.'
      : input.reviewsDue > 0 && input.newWords > 0
        ? `Plus ${input.newWords} new ${input.newWords === 1 ? 'word' : 'words'}.`
        : 'Spaced repetition keeps them in memory.';
  return {
    id: 'reviews',
    kind: 'reviews',
    title,
    detail,
    to: '/learn/vocab/review',
    minutes: Math.max(2, Math.ceil(total * 0.3)),
  };
}

function lessonTask(input: PlanInput): Task {
  const done = input.hangul.lessonsDone;
  const letterLesson = LETTER_LESSONS.find((l) => !done.includes(l.id));
  if (letterLesson) {
    return {
      id: `lesson:${letterLesson.id}`,
      kind: 'lesson',
      title: `Hangul lesson: ${letterLesson.title}`,
      detail: LETTERS.filter((l) => l.group === letterLesson.group)
        .map((l) => l.korean)
        .join(' '),
      to: `/learn/hangul/lesson/${letterLesson.id}`,
      minutes: 8,
    };
  }
  const rule = RULE_LESSONS.find((r) => !done.includes(r.id));
  if (rule) {
    return {
      id: `lesson:${rule.id}`,
      kind: 'lesson',
      title: `Reading rule: ${rule.title}`,
      detail: rule.summary,
      to: `/learn/hangul/rule/${rule.id}`,
      minutes: 6,
    };
  }
  // All Hangul lessons finished: practise numbers until grammar lessons exist (Phase 5).
  const mode = NUMBER_MODES[dayIndex(input.today) % NUMBER_MODES.length]!;
  return {
    id: `lesson:numbers-${mode}`,
    kind: 'lesson',
    title: `Numbers: ${NUMBER_MODE_INFO[mode].title}`,
    detail: 'Ten questions in the number trainer.',
    to: '/learn/vocab/numbers',
    minutes: 5,
  };
}

const LETTER_DRILLS: DrillType[] = ['letter-sound', 'look-alike', 'sound-letter', 'syllable'];

function drillTask(input: PlanInput): Task {
  const day = dayIndex(input.today);
  // Weakest area first: letters from finished lessons that are not solid yet.
  const weak = drillPool(input.hangul)
    .filter((l) => letterStatus(input.hangul.letters[l.korean]) !== 'solid')
    .map((l) => l.korean);
  if (weak.length > 0) {
    const type = LETTER_DRILLS[day % LETTER_DRILLS.length]!;
    return {
      id: `drill:${type}`,
      kind: 'drill',
      title: `Drill: ${DRILL_INFO[type].title}`,
      detail: `${weak.length} ${weak.length === 1 ? 'letter is' : 'letters are'} not solid yet: ${weak.slice(0, 6).join(' ')}`,
      to: `/learn/hangul/drill/${type}`,
      minutes: 4,
    };
  }
  const options = [
    { id: 'word', title: DRILL_INFO.word.title, to: '/learn/hangul/drill/word' },
    { id: 'timed', title: 'Timed reading', to: '/learn/hangul/timed' },
    { id: 'typing', title: 'Typing', to: '/learn/hangul/typing' },
  ];
  const pick = options[day % options.length]!;
  return {
    id: `drill:${pick.id}`,
    kind: 'drill',
    title: `Drill: ${pick.title}`,
    detail: 'All letters are solid. Keep your reading fast.',
    to: pick.to,
    minutes: 4,
  };
}

const TIMED: Task = {
  id: 'drill:timed-extra',
  kind: 'drill',
  title: 'Extra: timed reading',
  detail: '30 seconds. Try to beat your last speed.',
  to: '/learn/hangul/timed',
  minutes: 2,
};

export function buildPlan(input: PlanInput): Plan {
  const size: DailyGoal = input.comeback && !input.sizePicked ? 'minimum' : input.size;
  const reviews = reviewsTask(input);
  let tasks: Task[];

  if (size === 'minimum') {
    // About five minutes: reviews only. With nothing to review, one short drill instead.
    tasks = [reviews ?? drillTask(input)];
  } else {
    const culture: Task | null = input.culture
      ? { ...input.culture, id: `culture:${input.culture.id}`, kind: 'culture', minutes: 3 }
      : null;
    const ext = input.external ?? DUOLINGO;
    const external: Task = { ...ext, id: `external:${ext.id}`, kind: 'external', minutes: 5 };
    const drill = drillTask(input);
    // The extra task is the first to go when the list would pass five.
    const extra = size === 'intense' && drill.id !== 'drill:timed' ? TIMED : null;
    const core = [reviews, lessonTask(input), drill, culture, external].filter(
      (t): t is Task => t !== null,
    );
    tasks = extra && core.length < MAX_TASKS ? [...core.slice(0, -1), extra, external] : core;
  }

  tasks = tasks.slice(0, MAX_TASKS);
  return { size, tasks, minutes: tasks.reduce((sum, t) => sum + t.minutes, 0) };
}

/**
 * Is a task finished? Ticked by hand, or detected from what was actually done:
 * no reviews left, the lesson marked done, or ten drill answers today.
 */
export function isTaskDone(task: Task, input: PlanInput): boolean {
  const log = input.dayLog;
  if (log?.tasksDone.includes(task.id)) return true;
  if (task.kind === 'reviews') {
    return input.reviewsDue + input.newWords === 0 && (log?.reviews ?? 0) > 0;
  }
  if (task.kind === 'lesson') {
    return input.hangul.lessonsDone.includes(task.id.replace('lesson:', ''));
  }
  return false;
}
