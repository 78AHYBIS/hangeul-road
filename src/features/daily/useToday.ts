import { effectiveStartDate, studiedDates } from '../../lib/activity';
import { weakest } from '../../lib/grammarProgress';
import { courseTaskForToday } from '../../lib/libraryProgress';
import { todayISO } from '../../lib/date';
import { buildRoadmap, roadmapPosition } from '../../lib/roadmap';
import { LIMITS, buildQueue } from '../../lib/srs';
import { useAppStore } from '../../lib/storage/store';
import { computeStreak } from '../../lib/streak';
import { studyOrder } from '../vocab/words';
import { findResource } from '../library/resources';
import { cultureTaskForToday } from '../culture/culture';
import { buildPlan, dayIndex, isTaskDone, type PlanInput } from './tasks';

/** Gathers everything the Today page shows: plan, streak and roadmap position. */
export function useToday() {
  const settings = useAppStore((s) => s.settings);
  const hangul = useAppStore((s) => s.hangul);
  const vocab = useAppStore((s) => s.vocab);
  const activity = useAppStore((s) => s.activity);
  const library = useAppStore((s) => s.library);
  const grammar = useAppStore((s) => s.grammar);
  const phrases = useAppStore((s) => s.phrases);
  const culture = useAppStore((s) => s.culture);

  const today = todayISO();
  const dayLog = activity.days[today];
  const streak = computeStreak(studiedDates(activity), today);
  const stages = buildRoadmap(effectiveStartDate(activity, today), settings.departureDate);
  const position = roadmapPosition(stages, today, settings.departureDate);

  const size = dayLog?.size ?? settings.dailyGoal;
  // The plan decides the real size first (a comeback day is lighter), then the queue follows it.
  const planSize = streak.comeback && !dayLog?.size ? 'minimum' : size;
  const queue = buildQueue(vocab.cards, studyOrder(vocab), today, LIMITS[planSize]);

  const input: PlanInput = {
    today,
    size,
    sizePicked: Boolean(dayLog?.size),
    stage: position.stageId,
    comeback: streak.comeback,
    reviewsDue: queue.reviews.length,
    newWords: queue.newCards.length,
    hangul,
    grammarDone: grammar.done,
    packsDone: phrases.done,
    weakGrammar: weakest(grammar.done, grammar.results),
    weakPack: weakest(phrases.done, phrases.results),
    dayLog,
    culture: cultureTaskForToday(culture, today, position.stageId),
    // The next unit of an active Library course replaces the default Duolingo task.
    external: courseTaskForToday(
      library,
      (id) => findResource(library, id)?.name,
      today,
      dayIndex(today),
    ),
  };
  const plan = buildPlan(input);
  const tasks = plan.tasks.map((task) => ({ task, done: isTaskDone(task, input) }));

  const cardsDue = queue.reviews.length + queue.newCards.length;
  return { today, plan, tasks, streak, stages, position, settings, cardsDue };
}
