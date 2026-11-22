import { useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { Field, Segmented, dateInputClass } from '../../components/Form';
import { Card, Page } from '../../components/Page';
import { muted } from '../../components/ui';
import { effectiveStartDate } from '../../lib/activity';
import { daysUntil, isValidISODate, todayISO } from '../../lib/date';
import { lastBackupText } from '../../lib/ground';
import {
  canShareFiles,
  downloadBackup,
  restoreBackup,
  shareBackup,
} from '../../lib/storage/backup';
import {
  BackupError,
  SPEECH_RATE_MAX,
  SPEECH_RATE_MIN,
  type DailyGoal,
  type GroundMode,
  type TextSize,
  type Theme,
} from '../../lib/storage/schema';
import { useAppStore } from '../../lib/storage/store';
import { InstallCard } from './InstallCard';
import { ReminderSetting } from './ReminderSetting';
import { VoicePicker } from './VoicePicker';

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const TEXT_SIZE_OPTIONS: { value: TextSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
  { value: 'larger', label: 'Larger' },
];

const GOAL_OPTIONS: { value: DailyGoal; label: string; hint: string }[] = [
  { value: 'minimum', label: 'Minimum', hint: 'About 5 minutes' },
  { value: 'normal', label: 'Normal', hint: '20 to 30 minutes' },
  { value: 'intense', label: 'Intense', hint: '45 minutes or more' },
];

const GROUND_OPTIONS: { value: GroundMode; label: string; hint: string }[] = [
  { value: 'auto', label: 'Auto', hint: 'Switches on by itself on your departure day.' },
  { value: 'on', label: 'On', hint: 'On now: Today shows the semester and your Korea tools.' },
  { value: 'off', label: 'Off', hint: 'Today keeps the study view with the countdown.' },
];

export function MePage() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const hydrate = useAppStore((s) => s.hydrate);
  const activity = useAppStore((s) => s.activity);
  const setStartDate = useAppStore((s) => s.setStartDate);
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const recordBackup = useAppStore((s) => s.recordBackup);
  const sharing = canShareFiles();
  const sinceBackup = settings.lastBackupOn ? -daysUntil(settings.lastBackupOn) : null;

  async function handleShare() {
    const result = await shareBackup();
    if (result === 'cancelled') return;
    await recordBackup();
    setMessage({
      ok: true,
      text: result === 'shared' ? 'Backup shared.' : 'Backup file downloaded.',
    });
  }

  async function handleExport() {
    await downloadBackup();
    await recordBackup();
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
    <Page searchable title="Me" subtitle="Progress, settings and your data.">
      <Card>
        <ul className="divide-y divide-stone-200 dark:divide-stone-800">
          {[
            {
              to: '/me/progress',
              title: 'Progress',
              text: 'Words, calendar, time and reading speed.',
            },
            { to: '/me/week', title: 'Weekly review', text: 'The last seven days and one focus.' },
            { to: '/roadmap', title: 'Roadmap', text: 'The stages up to departure.' },
          ].map((item) => (
            <li key={item.to}>
              <Link to={item.to} className="flex min-h-14 items-center justify-between gap-3 py-2">
                <span>
                  <span className="block font-medium">{item.title}</span>
                  <span className="block text-sm text-stone-500 dark:text-stone-400">
                    {item.text}
                  </span>
                </span>
                <span className="text-teal-700 dark:text-teal-400" aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <InstallCard />

      <Card>
        <Field label="Theme">
          <Segmented
            name="Theme"
            value={settings.theme}
            options={THEME_OPTIONS}
            onChange={(theme) => void updateSettings({ theme })}
          />
        </Field>

        <Field label="Text size" hint="Makes every screen larger or smaller.">
          <Segmented
            name="Text size"
            value={settings.textSize}
            options={TEXT_SIZE_OPTIONS}
            onChange={(textSize) => void updateSettings({ textSize })}
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
          label="Typing cards"
          hint="Reviews where you type the word in Hangul (needs a Korean keyboard)."
          inline
        >
          <input
            type="checkbox"
            role="switch"
            aria-label="Typing cards"
            className="size-6 shrink-0 accent-teal-700"
            checked={settings.typingCards}
            onChange={(e) => void updateSettings({ typingCards: e.target.checked })}
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

        <Field label="Start date" hint="The roadmap is planned from this day.">
          <input
            type="date"
            aria-label="Start date"
            className={dateInputClass}
            value={effectiveStartDate(activity, todayISO())}
            onChange={(e) => {
              if (isValidISODate(e.target.value)) void setStartDate(e.target.value);
            }}
          />
        </Field>

        <Field label="Departure date" last>
          <input
            type="date"
            aria-label="Departure date"
            className={dateInputClass}
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
        <VoicePicker />
      </Card>

      <Card>
        <h2 className="font-semibold">On-the-ground mode</h2>
        <p className={`mt-1 mb-3 ${muted}`}>
          {GROUND_OPTIONS.find((o) => o.value === settings.groundMode)?.hint}
        </p>
        <Segmented
          name="On-the-ground mode"
          value={settings.groundMode}
          options={GROUND_OPTIONS}
          onChange={(groundMode) => void updateSettings({ groundMode })}
        />
        <Field label="Semester ends" hint="Shown as days left in on-the-ground mode." last>
          <input
            type="date"
            aria-label="Semester end date"
            className={dateInputClass}
            value={settings.semesterEnd}
            onChange={(e) => {
              if (isValidISODate(e.target.value))
                void updateSettings({ semesterEnd: e.target.value });
            }}
          />
        </Field>
      </Card>

      <Card>
        <ReminderSetting />
      </Card>

      <Card>
        <h2 className="font-semibold">Your data</h2>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Everything is stored only on this device. A backup file keeps your progress safe when you
          switch phones or clear your browser data.
        </p>
        <p className="mt-2 text-sm font-medium" data-testid="last-backup">
          {lastBackupText(sinceBackup)}
        </p>
        {sharing && (
          <button
            type="button"
            onClick={() => void handleShare()}
            className="mt-3 min-h-11 w-full rounded-xl bg-teal-700 px-4 font-medium text-white active:bg-teal-800"
          >
            Share backup
          </button>
        )}
        {sharing && (
          <p className={`mt-1 ${muted}`}>
            Save it to Google Drive or Files, or send it to yourself on Telegram or by email.
          </p>
        )}
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={() => void handleExport()}
            className={`min-h-11 flex-1 rounded-xl px-4 font-medium ${
              sharing
                ? 'border border-stone-300 dark:border-stone-700'
                : 'bg-teal-700 text-white active:bg-teal-800'
            }`}
          >
            {sharing ? 'Download' : 'Export backup'}
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
