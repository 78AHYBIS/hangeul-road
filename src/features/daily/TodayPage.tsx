import { Link } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { muted } from '../../components/ui';
import { daysUntil, formatLongDate } from '../../lib/date';
import { isOnTheGround, semesterStatus } from '../../lib/ground';
import { DAILY_GOALS, type DailyGoal } from '../../lib/storage/schema';
import { useAppStore } from '../../lib/storage/store';
import { checklistForToday, type ChecklistStatus } from '../korea-guide/guide';
import { ChecklistItems } from '../korea-guide/shared';
import { useToday } from './useToday';

const SIZE_LABEL: Record<DailyGoal, string> = {
  minimum: 'Minimum',
  normal: 'Normal',
  intense: 'Intense',
};

export function TodayPage() {
  const { plan, tasks, streak, position, settings, cardsDue } = useToday();
  const toggleTask = useAppStore((s) => s.toggleTask);
  const toggleCourseUnit = useAppStore((s) => s.toggleCourseUnit);
  const setCardRead = useAppStore((s) => s.setCardRead);
  const setDaySize = useAppStore((s) => s.setDaySize);
  const koreaGuide = useAppStore((s) => s.koreaGuide);
  const days = daysUntil(settings.departureDate);
  const checklist = checklistForToday(koreaGuide, days);
  const doneCount = tasks.filter((t) => t.done).length;
  const allDone = doneCount === tasks.length;
  const ground = isOnTheGround(settings.groundMode, days);

  return (
    <Page searchable title="Today" subtitle={`About ${plan.minutes} minutes`}>
      {ground ? (
        <>
          <SemesterCard
            days={days}
            daysToEnd={daysUntil(settings.semesterEnd)}
            streak={streak.current}
          />
          <GroundTools cardsDue={cardsDue} />
        </>
      ) : (
        <Countdown days={days} streak={streak.current} departureDate={settings.departureDate} />
      )}

      {ground && checklist && <ChecklistCard status={checklist} />}

      {streak.comeback && (
        <Card>
          <h2 className="font-semibold">Welcome back</h2>
          <p className={`mt-1 ${muted}`}>
            Here is today’s plan. It is a light one to get going again.
          </p>
        </Card>
      )}

      <Card>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">Today’s plan</h2>
          <p className={`tabular-nums ${muted}`} data-testid="task-progress">
            {doneCount} / {tasks.length}
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Day size"
          className="mt-3 flex rounded-xl bg-stone-100 p-1 dark:bg-stone-800"
        >
          {DAILY_GOALS.map((size) => (
            <button
              key={size}
              type="button"
              role="radio"
              aria-checked={plan.size === size}
              onClick={() => void setDaySize(size)}
              className={`min-h-10 flex-1 rounded-lg text-sm font-medium ${
                plan.size === size
                  ? 'bg-white text-teal-700 shadow-sm dark:bg-stone-950 dark:text-teal-400'
                  : 'text-stone-600 dark:text-stone-300'
              }`}
            >
              {SIZE_LABEL[size]}
            </button>
          ))}
        </div>

        <ul className="mt-2 divide-y divide-stone-200 dark:divide-stone-800" data-testid="tasks">
          {tasks.map(({ task, done }) => (
            <li key={task.id} className="flex items-center gap-3 py-3" data-task={task.id}>
              <input
                type="checkbox"
                className="size-6 shrink-0 accent-teal-700"
                checked={done}
                onChange={() =>
                  void (task.unit
                    ? toggleCourseUnit(task.unit.resourceId, task.unit.unitId)
                    : task.card
                      ? setCardRead(task.card, !done)
                      : toggleTask(task.id))
                }
                aria-label={`Done: ${task.title}`}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`font-medium ${done ? 'text-stone-500 line-through dark:text-stone-400' : ''}`}
                >
                  {task.title}
                </p>
                <p className={muted}>
                  {task.detail} · {task.minutes} min
                </p>
              </div>
              {task.to && !done && (
                <Link
                  to={task.to}
                  className="flex min-h-10 shrink-0 items-center rounded-lg bg-teal-700 px-3 text-sm font-medium text-white"
                >
                  Go
                </Link>
              )}
            </li>
          ))}
        </ul>
        {allDone && (
          <p className="mt-2 font-medium text-teal-700 dark:text-teal-400" role="status">
            Done for today. See you tomorrow.
          </p>
        )}
      </Card>

      {!ground && checklist && <ChecklistCard status={checklist} />}

      <Link to="/roadmap" className="block">
        <Card>
          <p className={muted}>
            Week {position.week} of {position.totalWeeks}
          </p>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold" data-testid="stage">
              {position.title}
            </h2>
            <span className="text-teal-700 dark:text-teal-400" aria-hidden="true">
              Roadmap ›
            </span>
          </div>
          <p className={`mt-1 ${muted}`}>{position.focus}</p>
        </Card>
      </Link>
    </Page>
  );
}

/** The current arrival checklist (last 3 weeks before departure and the first weeks after). */
function ChecklistCard({ status }: { status: ChecklistStatus }) {
  const { checklist, done, total } = status;
  return (
    <Card>
      <section aria-labelledby="today-checklist" data-testid="today-checklist">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="today-checklist" className="font-semibold">
            Checklist: {checklist.title}
          </h2>
          <p className={`tabular-nums ${muted}`}>
            {done} / {total}
          </p>
        </div>
        <p className={`mt-1 ${muted}`}>{checklist.intro}</p>
        <ChecklistItems checklist={checklist} limit={3} />
        <Link
          to="/korea/checklists"
          className="flex min-h-10 items-center text-sm font-medium text-teal-700 dark:text-teal-400"
        >
          All checklists ›
        </Link>
      </section>
    </Card>
  );
}

/** Before departure: days to go and the streak. */
function Countdown({
  days,
  streak,
  departureDate,
}: {
  days: number;
  streak: number;
  departureDate: string;
}) {
  return (
    <Card tone="accent">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-teal-100">Departure to Korea</p>
          {days > 0 ? (
            <p className="mt-1">
              <span className="text-5xl font-bold tabular-nums" data-testid="countdown-days">
                {days}
              </span>{' '}
              <span className="text-lg">{days === 1 ? 'day to go' : 'days to go'}</span>
            </p>
          ) : (
            <p className="mt-1 text-3xl font-bold" data-testid="countdown-days">
              {days === 0 ? 'Today is the day' : 'You are in Korea'}
            </p>
          )}
        </div>
        <p className="text-right text-sm text-teal-100" data-testid="streak">
          <span className="block text-3xl font-bold text-white tabular-nums">{streak}</span>
          day streak
        </p>
      </div>
      <p className="mt-2 text-sm text-teal-100">
        {formatLongDate(departureDate)} ·{' '}
        <Link to="/me" className="underline underline-offset-2">
          change date
        </Link>
      </p>
    </Card>
  );
}

/** On-the-ground mode: days in Korea and days of the semester left, instead of the countdown. */
function SemesterCard({
  days,
  daysToEnd,
  streak,
}: {
  days: number;
  daysToEnd: number;
  streak: number;
}) {
  const { dayInKorea, daysLeft } = semesterStatus(days, daysToEnd);
  return (
    <Card tone="accent">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-teal-100">
            {dayInKorea > 0 ? 'In Korea' : 'On-the-ground mode (preview)'}
          </p>
          <p className="mt-1" data-testid="semester-day">
            {dayInKorea > 0 ? (
              <>
                <span className="text-5xl font-bold tabular-nums">Day {dayInKorea}</span>
              </>
            ) : (
              <span className="text-2xl font-bold">
                {days} {days === 1 ? 'day' : 'days'} to departure
              </span>
            )}
          </p>
        </div>
        <p className="text-right text-sm text-teal-100" data-testid="streak">
          <span className="block text-3xl font-bold text-white tabular-nums">{streak}</span>
          day streak
        </p>
      </div>
      <p className="mt-2 text-sm text-teal-100">
        {daysLeft > 0
          ? `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} of the semester left`
          : daysLeft === 0
            ? 'Last day of the semester'
            : 'The semester is over. Well done.'}{' '}
        ·{' '}
        <Link to="/me" className="underline underline-offset-2">
          settings
        </Link>
      </p>
    </Card>
  );
}

const GROUND_TOOLS = [
  {
    to: '/learn/phrases/book',
    title: 'Phrasebook',
    icon: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4ZM5 17a3 3 0 0 1 3-3h11',
  },
  {
    to: '/korea/apps',
    title: 'Apps guide',
    icon: 'M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM11 18h2',
  },
  {
    to: '/learn/vocab/review',
    title: 'Reviews',
    icon: 'M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4',
  },
] as const;

/** On-the-ground mode: the three things used most in Korea, one tap away. */
function GroundTools({ cardsDue }: { cardsDue: number }) {
  return (
    <nav aria-label="Korea tools">
      <ul className="grid grid-cols-3 gap-3">
        {GROUND_TOOLS.map((tool) => (
          <li key={tool.to}>
            <Link
              to={tool.to}
              className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border border-stone-200 bg-white p-2 text-center text-sm font-medium dark:border-stone-800 dark:bg-stone-900"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-6 text-teal-700 dark:text-teal-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={tool.icon} />
              </svg>
              {tool.title}
              {tool.title === 'Reviews' && (
                <span className={muted}>{cardsDue === 0 ? 'none due' : `${cardsDue} due`}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
