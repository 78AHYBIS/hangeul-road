/**
 * Builds today's task list (at most 5). Pure logic: everything it needs is passed in,
 * so the same inputs always give the same plan.
 *
 * Nothing is carried over: the plan is rebuilt from the current state every day,
 * and yesterday's unticked tasks are simply gone.
 */
import { GRAMMAR_LESSONS, findGrammarLesson } from '../../content/grammar';
import { LETTERS, LETTER_LESSONS, RULE_LESSONS } from '../../content/hangul';
import { PHRASE_PACKS, findPack } from '../../content/phrases';
import type { DayLog } from '../../lib/activity';
import { parseISODate, type ISODate } from '../../lib/date';
import { letterStatus, type HangulProgress } from '../../lib/hangulProgress';
import type { StageId } from '../../lib/roadmap';
import type { DailyGoal } from '../../lib/storage/schema';
import { NUMBER_MODES, NUMBER_MODE_INFO, type NumberMode } from '../vocab/numberDrill';
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
  /** Set when the task is a unit of an active course: ticking it ticks the unit. */
  unit?: { resourceId: string; unitId: string };
}

/** A task supplied by another part of the app (culture cards, active course). */
export interface ExtraTask {
  id: string;
  title: string;
  detail: string;
  to?: string;
  /** Already done today (e.g. the course unit was ticked in the Library). */
  done?: boolean;
  unit?: { resourceId: string; unitId: string };
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
  /** Finished grammar lessons and phrase packs (ids). */
  grammarDone: string[];
  packsDone: string[];
  /** The finished lesson and pack with the lowest last score, for practice drills. */
  weakGrammar?: string | null;
  weakPack?: string | null;
  dayLog: DayLog | undefined;
  /** Phase 6 passes today's culture card here. */
  culture?: ExtraTask | null;
  /** The next unit of an active course (see courseTaskForToday); otherwise Duolingo. */
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
export function dayIndex(date: ISODate): number {
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

// ---------- Lesson slot ----------

function letterLessonTask(id: string): Task | null {
  const lesson = LETTER_LESSONS.find((l) => l.id === id);
  if (!lesson) return null;
  return {
    id: `lesson:${lesson.id}`,
    kind: 'lesson',
    title: `Hangul lesson: ${lesson.title}`,
    detail: LETTERS.filter((l) => l.group === lesson.group)
      .map((l) => l.korean)
      .join(' '),
    to: `/learn/hangul/lesson/${lesson.id}`,
    minutes: 8,
  };
}

function ruleTask(id: string): Task | null {
  const rule = RULE_LESSONS.find((r) => r.id === id);
  if (!rule) return null;
  return {
    id: `lesson:${rule.id}`,
    kind: 'lesson',
    title: `Reading rule: ${rule.title}`,
    detail: rule.summary,
    to: `/learn/hangul/rule/${rule.id}`,
    minutes: 6,
  };
}

function grammarTask(id: string): Task | null {
  const lesson = findGrammarLesson(id);
  if (!lesson) return null;
  return {
    id: `lesson:${lesson.id}`,
    kind: 'lesson',
    title: `Grammar: ${lesson.title}`,
    detail: `${lesson.summary} Explanation, examples and practice.`,
    to: `/learn/grammar/${lesson.id}`,
    minutes: 8,
  };
}

function packTask(id: string): Task | null {
  const pack = findPack(id);
  if (!pack) return null;
  return {
    id: `lesson:${pack.id}`,
    kind: 'lesson',
    title: `Phrases: ${pack.title}`,
    detail: `A short dialogue, ${pack.phrases.length} key phrases and a quiz.`,
    to: `/learn/phrases/${pack.id}`,
    minutes: 8,
  };
}

function numbersTask(mode: NumberMode): Task {
  return {
    id: `lesson:numbers-${mode}`,
    kind: 'lesson',
    title: `Numbers: ${NUMBER_MODE_INFO[mode].title}`,
    detail: 'Ten questions in the number trainer.',
    to: '/learn/vocab/numbers',
    minutes: 5,
  };
}

/** Rebuilds a lesson task from its id (used to keep today's finished lesson in place). */
export function lessonTaskById(taskId: string): Task | null {
  const id = taskId.replace(/^lesson:/, '');
  const mode = NUMBER_MODES.find((m) => id === `numbers-${m}`);
  if (mode) return numbersTask(mode);
  return letterLessonTask(id) ?? ruleTask(id) ?? grammarTask(id) ?? packTask(id);
}

type LessonSource = 'rules' | 'grammar' | 'packs';

/**
 * Which kind of lesson comes next, by roadmap stage, once the letter lessons are done.
 * Survival weeks alternate phrase packs and grammar day by day.
 */
export function lessonOrder(stage: StageId, today: ISODate): LessonSource[] {
  switch (stage) {
    case 'hangul':
      return ['rules', 'grammar', 'packs'];
    case 'core':
      return ['grammar', 'rules', 'packs'];
    case 'survival':
      return dayIndex(today) % 2 === 0
        ? ['packs', 'grammar', 'rules']
        : ['grammar', 'packs', 'rules'];
    default:
      return ['packs', 'grammar', 'rules'];
  }
}

function lessonTask(input: PlanInput): Task {
  // A lesson finished (or ticked) today stays as today's lesson, shown as done.
  const ticked = input.dayLog?.tasksDone.find((id) => id.startsWith('lesson:'));
  const kept = ticked ? lessonTaskById(ticked) : null;
  if (kept) return kept;

  // Letters always come first: nothing else can be read without them.
  const done = input.hangul.lessonsDone;
  const letterLesson = LETTER_LESSONS.find((l) => !done.includes(l.id));
  if (letterLesson) return letterLessonTask(letterLesson.id)!;

  const next: Record<LessonSource, () => Task | null> = {
    rules: () => {
      const rule = RULE_LESSONS.find((r) => !done.includes(r.id));
      return rule ? ruleTask(rule.id) : null;
    },
    grammar: () => {
      const lesson = GRAMMAR_LESSONS.find((l) => !input.grammarDone.includes(l.id));
      return lesson ? grammarTask(lesson.id) : null;
    },
    packs: () => {
      const pack = PHRASE_PACKS.find((p) => !input.packsDone.includes(p.id));
      return pack ? packTask(pack.id) : null;
    },
  };
  for (const source of lessonOrder(input.stage, input.today)) {
    const task = next[source]();
    if (task) return task;
  }
  // Every lesson finished: keep numbers sharp, a different mode each day.
  return numbersTask(NUMBER_MODES[dayIndex(input.today) % NUMBER_MODES.length]!);
}

// ---------- Drill slot ----------

function grammarDrill(id: string): Task | null {
  const lesson = findGrammarLesson(id);
  if (!lesson) return null;
  return {
    id: `drill:grammar:${id}`,
    kind: 'drill',
    title: `Practice: ${lesson.title}`,
    detail: 'Your lowest grammar score. One more round.',
    to: `/learn/grammar/${id}/practice`,
    minutes: 4,
  };
}

function quizDrill(id: string): Task | null {
  const pack = findPack(id);
  if (!pack) return null;
  return {
    id: `drill:quiz:${id}`,
    kind: 'drill',
    title: `Phrase quiz: ${pack.title}`,
    detail: 'Your lowest phrase quiz. Six quick questions.',
    to: `/learn/phrases/${id}/quiz`,
    minutes: 3,
  };
}

const LETTER_DRILLS: DrillType[] = ['letter-sound', 'look-alike', 'sound-letter', 'syllable'];

function drillTask(input: PlanInput): Task {
  const day = dayIndex(input.today);
  // A practice drill done today stays put, like the lesson.
  for (const id of input.dayLog?.tasksDone ?? []) {
    const kept = id.startsWith('drill:grammar:')
      ? grammarDrill(id.slice('drill:grammar:'.length))
      : id.startsWith('drill:quiz:')
        ? quizDrill(id.slice('drill:quiz:'.length))
        : null;
    if (kept) return kept;
  }
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
  // Letters are solid: grammar practice and phrase quizzes join the rotation.
  const practice = [
    input.weakGrammar ? grammarDrill(input.weakGrammar) : null,
    input.weakPack ? quizDrill(input.weakPack) : null,
  ].filter((t): t is Task => t !== null);
  const options = [
    { id: 'word', title: DRILL_INFO.word.title, to: '/learn/hangul/drill/word' },
    { id: 'timed', title: 'Timed reading', to: '/learn/hangul/timed' },
    { id: 'typing', title: 'Typing', to: '/learn/hangul/typing' },
  ];
  // With practice available, it gets two days out of every three.
  if (practice.length > 0 && day % 3 !== 0) return practice[day % practice.length]!;
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
    const external: Task = {
      id: `external:${ext.id}`,
      kind: 'external',
      title: ext.title,
      detail: ext.detail,
      to: ext.to,
      unit: ext.unit,
      minutes: 5,
    };
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
 * no reviews left, the lesson marked done, or the course unit ticked today.
 */
export function isTaskDone(task: Task, input: PlanInput): boolean {
  const log = input.dayLog;
  if (log?.tasksDone.includes(task.id)) return true;
  if (task.kind === 'reviews') {
    return input.reviewsDue + input.newWords === 0 && (log?.reviews ?? 0) > 0;
  }
  if (task.kind === 'lesson') {
    const id = task.id.replace('lesson:', '');
    return (
      input.hangul.lessonsDone.includes(id) ||
      input.grammarDone.includes(id) ||
      input.packsDone.includes(id)
    );
  }
  if (task.kind === 'external' && input.external) {
    return task.id === `external:${input.external.id}` && input.external.done === true;
  }
  return false;
}
