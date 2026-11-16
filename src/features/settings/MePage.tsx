import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Card, Page } from '../../components/Page';
import { isValidISODate } from '../../lib/date';
import { downloadBackup, restoreBackup } from '../../lib/storage/backup';
import {
  BackupError,
  SPEECH_RATE_MAX,
  SPEECH_RATE_MIN,
  type DailyGoal,
  type Theme,
} from '../../lib/storage/schema';
import { useAppStore } from '../../lib/storage/store';

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const GOAL_OPTIONS: { value: DailyGoal; label: string; hint: string }[] = [
  { value: 'minimum', label: 'Minimum', hint: 'About 5 minutes' },
  { value: 'normal', label: 'Normal', hint: '20 to 30 minutes' },
  { value: 'intense', label: 'Intense', hint: '45 minutes or more' },
];

export function MePage() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const hydrate = useAppStore((s) => s.hydrate);
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleExport() {
    await downloadBackup();
    setMessage({ ok: true, text: 'Backup file downloaded.' });
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // lets the same file be picked again later
    if (!file) return;
    if (!window.confirm('Importing replaces all progress on this device. Continue?')) return;
    try {
      await restoreBackup(await file.text());
      await hydrate();
      setMessage({ ok: true, text: 'Backup imported.' });
    } catch (error) {
      const text = error instanceof BackupError ? error.message : 'The import failed.';
      setMessage({ ok: false, text: `${text} Nothing was changed.` });
    }
  }

  return (
    <Page title="Me" subtitle="Settings and your data.">
      <Card>
        <Field label="Theme">
          <Segmented
            name="Theme"
            value={settings.theme}
            options={THEME_OPTIONS}
            onChange={(theme) => void updateSettings({ theme })}
          />
        </Field>

        <Field
          label="Daily goal"
          hint={GOAL_OPTIONS.find((o) => o.value === settings.dailyGoal)?.hint}
        >
          <Segmented
            name="Daily goal"
            value={settings.dailyGoal}
            options={GOAL_OPTIONS}
            onChange={(dailyGoal) => void updateSettings({ dailyGoal })}
          />
        </Field>

        <Field label="Show romanization" hint="Latin letters next to Korean text." inline>
          <input
            type="checkbox"
            role="switch"
            aria-label="Show romanization"
            className="size-6 accent-teal-700"
            checked={settings.showRomanization}
            onChange={(e) => void updateSettings({ showRomanization: e.target.checked })}
          />
        </Field>

        <Field
          label="Speech rate"
          hint={`${settings.speechRate.toFixed(1)}× (1.0 is normal speed)`}
        >
          <input
            type="range"
            aria-label="Speech rate"
            className="w-full accent-teal-700"
            min={SPEECH_RATE_MIN}
            max={SPEECH_RATE_MAX}
            step={0.1}
            value={settings.speechRate}
            onChange={(e) => void updateSettings({ speechRate: Number(e.target.value) })}
          />
        </Field>

        <Field label="Departure date" last>
          <input
            type="date"
            aria-label="Departure date"
            className="w-full rounded-lg border border-stone-300 bg-transparent px-3 py-2 dark:border-stone-700"
            value={settings.departureDate}
            onChange={(e) => {
              // An emptied date field is ignored, so the saved date stays valid.
              if (isValidISODate(e.target.value))
                void updateSettings({ departureDate: e.target.value });
            }}
          />
        </Field>
      </Card>

      <Card>
        <h2 className="font-semibold">Your data</h2>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Everything is stored only on this device. Export a backup before you switch phones or
          clear your browser data.
        </p>
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={() => void handleExport()}
            className="min-h-11 flex-1 rounded-xl bg-teal-700 px-4 font-medium text-white active:bg-teal-800"
          >
            Export backup
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="min-h-11 flex-1 rounded-xl border border-stone-300 px-4 font-medium dark:border-stone-700"
          >
            Import backup
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            data-testid="import-input"
            onChange={(e) => void handleImport(e)}
          />
        </div>
        {message && (
          <p
            role="status"
            className={`mt-3 text-sm ${message.ok ? 'text-teal-700 dark:text-teal-400' : 'text-amber-700 dark:text-amber-400'}`}
          >
            {message.text}
          </p>
        )}
      </Card>
    </Page>
  );
}

function Field({
  label,
  hint,
  inline = false,
  last = false,
  children,
}: {
  label: string;
  hint?: string;
  inline?: boolean;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`${inline ? 'flex items-center justify-between gap-4' : 'space-y-2'} ${
        last ? 'pt-4' : 'border-b border-stone-200 py-4 first:pt-0 dark:border-stone-800'
      }`}
    >
      <div>
        <p className="font-medium">{label}</p>
        {hint && <p className="text-sm text-stone-500 dark:text-stone-400">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

/** A row of buttons where exactly one is selected (a nicer radio group). */
function Segmented<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className="flex rounded-xl bg-stone-100 p-1 dark:bg-stone-800"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={`min-h-10 flex-1 rounded-lg text-sm font-medium ${
            option.value === value
              ? 'bg-white text-teal-700 shadow-sm dark:bg-stone-950 dark:text-teal-400'
              : 'text-stone-600 dark:text-stone-300'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
