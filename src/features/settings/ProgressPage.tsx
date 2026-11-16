import { Link } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { muted } from '../../components/ui';
import { isStudied, levelOf, totals, xpOf } from '../../lib/activity';
import { addDays, todayISO } from '../../lib/date';
import { useAppStore } from '../../lib/storage/store';
import { weekStart } from '../../lib/streak';
import { allWords, countStages } from '../vocab/words';

const WEEKS = 10;
const STAGES = [
  { id: 'mature', label: 'Mature', color: 'bg-teal-700' },
  { id: 'review', label: 'Review', color: 'bg-teal-400' },
  { id: 'learning', label: 'Learning', color: 'bg-amber-400' },
  { id: 'new', label: 'New', color: 'bg-stone-300 dark:bg-stone-700' },
] as const;

function formatTime(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export function ProgressPage() {
  const activity = useAppStore((s) => s.activity);
  const vocab = useAppStore((s) => s.vocab);
  const hangul = useAppStore((s) => s.hangul);

  const today = todayISO();
  const words = allWords(vocab.myWords);
  const stages = countStages(words, vocab.cards);
  const all = totals(activity);
  const week = totals(activity, addDays(today, -6), today);
  const xp = xpOf(activity);
  const { level, next } = levelOf(xp);
  const speeds = hangul.readingSpeed.slice(-12);
  const best = Math.max(1, ...speeds.map((s) => s.perMinute));

  // Calendar: whole weeks (Monday first), ending with the current week.
  const firstDay = addDays(weekStart(today), -7 * (WEEKS - 1));
  const calendar = Array.from({ length: WEEKS * 7 }, (_, i) => addDays(firstDay, i));

  return (
    <Page title="Progress" back={{ to: '/me', label: 'Me' }}>
      <Card>
        <h2 className="font-semibold">Words by stage</h2>
        <div
          className="mt-3 flex h-3 overflow-hidden rounded-full"
          role="img"
          aria-label="Words by stage"
        >
          {STAGES.map((s) => (
            <span
              key={s.id}
              className={s.color}
              style={{ width: `${(stages[s.id] / words.length) * 100}%` }}
            />
          ))}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm" data-testid="progress-stages">
          {STAGES.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${s.color}`} />
                {s.label}
              </dt>
              <dd className="font-medium tabular-nums">{stages[s.id]}</dd>
            </div>
          ))}
        </dl>
        <p className={`mt-2 ${muted}`}>
          {words.length - stages.new} of {words.length} words started.
        </p>
      </Card>

      <Card>
        <h2 className="font-semibold">Study calendar</h2>
        <p className={`mt-1 ${muted}`}>
          {all.daysStudied} {all.daysStudied === 1 ? 'day' : 'days'} studied in total.
        </p>
        <div className="mx-auto mt-3 grid max-w-56 grid-cols-7 gap-1.5" data-testid="calendar">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i} className="text-center text-xs text-stone-500">
              {d}
            </span>
          ))}
          {calendar.map((date) => (
            <span
              key={date}
              title={date}
              data-studied={isStudied(activity.days[date])}
              className={`aspect-square rounded-md ${
                isStudied(activity.days[date])
                  ? 'bg-teal-700'
                  : date > today
                    ? 'bg-transparent'
                    : 'bg-stone-200 dark:bg-stone-800'
              } ${date === today ? 'ring-2 ring-amber-400' : ''}`}
            />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Time studied</h2>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-stone-100 py-2 dark:bg-stone-800">
            <dd className="text-xl font-bold" data-testid="time-week">
              {formatTime(week.seconds)}
            </dd>
            <dt className="text-xs text-stone-500 dark:text-stone-400">last 7 days</dt>
          </div>
          <div className="rounded-xl bg-stone-100 py-2 dark:bg-stone-800">
            <dd className="text-xl font-bold">{formatTime(all.seconds)}</dd>
            <dt className="text-xs text-stone-500 dark:text-stone-400">in total</dt>
          </div>
        </dl>
        <p className={`mt-2 ${muted}`}>An estimate, counted while you answer cards and drills.</p>
      </Card>

      <Card>
        <h2 className="font-semibold">Hangul reading speed</h2>
        {speeds.length === 0 ? (
          <p className={`mt-1 ${muted}`}>
            No results yet. Try the{' '}
            <Link to="/learn/hangul/timed" className="underline">
              timed reading drill
            </Link>
            .
          </p>
        ) : (
          <ol className="mt-3 flex h-28 items-end gap-1.5" aria-label="Reading speed history">
            {speeds.map((entry, i) => (
              <li key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-xs tabular-nums">{entry.perMinute}</span>
                <span
                  className="w-full rounded-t bg-teal-700"
                  style={{ height: `${Math.max(4, (entry.perMinute / best) * 70)}%` }}
                />
                <span className="text-[10px] text-stone-500">{entry.date.slice(5)}</span>
              </li>
            ))}
          </ol>
        )}
        <p className={`mt-2 ${muted}`}>Items read aloud per minute.</p>
      </Card>

      <p className={`text-center ${muted}`} data-testid="level">
        Level {level} · {xp} points · next level at {next}
      </p>
    </Page>
  );
}
