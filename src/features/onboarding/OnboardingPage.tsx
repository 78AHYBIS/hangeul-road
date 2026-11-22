import { useState } from 'react';
import { Card } from '../../components/Page';
import { Field, Segmented, dateInputClass } from '../../components/Form';
import { btnPrimary, muted } from '../../components/ui';
import { formatLongDate, isValidISODate, todayISO } from '../../lib/date';
import { DEFAULT_SETTINGS, type DailyGoal } from '../../lib/storage/schema';
import { useAppStore } from '../../lib/storage/store';

const GOALS: { value: DailyGoal; label: string; hint: string }[] = [
  { value: 'minimum', label: 'Minimum', hint: 'About 5 minutes a day: reviews only.' },
  { value: 'normal', label: 'Normal', hint: '20 to 30 minutes a day. A good default.' },
  { value: 'intense', label: 'Intense', hint: '45 minutes or more, when you have time.' },
];

type Level = 'zero' | 'hangul';
const LEVELS: { value: Level; label: string; hint: string }[] = [
  { value: 'zero', label: 'Starting from zero', hint: 'Today starts with the Korean alphabet.' },
  {
    value: 'hangul',
    label: 'I can read Hangul',
    hint: 'The letter lessons are marked done. Drills and sound rules stay open.',
  },
];

/** First launch: four questions, all changeable later in Me. */
export function OnboardingPage() {
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [startDate, setStartDate] = useState(todayISO);
  const [departureDate, setDepartureDate] = useState(DEFAULT_SETTINGS.departureDate);
  const [dailyGoal, setDailyGoal] = useState<DailyGoal>('normal');
  const [level, setLevel] = useState<Level>('zero');
  const [saving, setSaving] = useState(false);
  const valid = isValidISODate(startDate) && isValidISODate(departureDate);

  async function finish(useDefaults: boolean) {
    setSaving(true);
    await completeOnboarding(
      useDefaults
        ? {
            startDate: todayISO(),
            departureDate: DEFAULT_SETTINGS.departureDate,
            dailyGoal: 'normal',
            knowsHangul: false,
          }
        : { startDate, departureDate, dailyGoal, knowsHangul: level === 'hangul' },
    );
  }

  return (
    <main id="main" className="mx-auto max-w-xl space-y-5 px-4 pt-8 pb-12">
      <header className="flex items-center gap-3">
        <img src="./icon.svg" alt="" className="size-12" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to Hangeul Road</h1>
          <p className={muted}>Four quick questions. You can change all of them later in Me.</p>
        </div>
      </header>

      <Card>
        <Field
          label="When do you start?"
          hint="Your roadmap is planned from this day to departure."
        >
          <input
            type="date"
            aria-label="Start date"
            className={dateInputClass}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Field>

        <Field
          label="When do you fly to Korea?"
          hint={isValidISODate(departureDate) ? formatLongDate(departureDate) : 'Pick a date.'}
        >
          <input
            type="date"
            aria-label="Departure date"
            className={dateInputClass}
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
          />
        </Field>

        <Field label="Daily goal" hint={GOALS.find((g) => g.value === dailyGoal)?.hint}>
          <Segmented name="Daily goal" value={dailyGoal} options={GOALS} onChange={setDailyGoal} />
        </Field>

        <Field
          label="Your Korean right now"
          hint={LEVELS.find((l) => l.value === level)?.hint}
          last
        >
          <Segmented name="Current level" value={level} options={LEVELS} onChange={setLevel} />
        </Field>
      </Card>

      <button
        type="button"
        className={`w-full ${btnPrimary}`}
        disabled={!valid || saving}
        onClick={() => void finish(false)}
      >
        Start learning
      </button>
      <button
        type="button"
        className="flex min-h-11 w-full items-center justify-center text-sm font-medium text-teal-700 dark:text-teal-400"
        disabled={saving}
        onClick={() => void finish(true)}
      >
        Skip and use the defaults
      </button>

      <p className={`text-center ${muted}`}>
        No account, no tracking. Everything stays on this device, and works offline.
      </p>
    </main>
  );
}
