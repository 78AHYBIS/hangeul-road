/**
 * Shape of everything the app saves, plus the rules for reading old or untrusted data.
 *
 * Storage is a simple key -> value table. Each feature owns one key (see STORAGE_KEYS).
 * When a saved shape changes in a later phase: bump SCHEMA_VERSION and add a step
 * to `migrate()` below.
 */
import { isValidISODate, type ISODate } from '../date';
import { sanitizeHangulProgress } from '../hangulProgress';
import { sanitizeVocabProgress } from '../vocabProgress';
import { sanitizeActivity } from '../activity';
import { sanitizeLibrary } from '../libraryProgress';
import { sanitizeGrammarProgress } from '../grammarProgress';
import { sanitizePhraseProgress } from '../phraseProgress';
import { sanitizeCultureProgress } from '../cultureProgress';
import { sanitizeKoreaGuideProgress } from '../koreaGuideProgress';

export const APP_ID = 'hangeul-road';
export const SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
  settings: 'settings',
  hangul: 'hangul',
  vocab: 'vocab',
  activity: 'activity',
  library: 'library',
  grammar: 'grammar',
  phrases: 'phrases',
  culture: 'culture',
  koreaGuide: 'koreaGuide',
} as const;

export type Theme = 'system' | 'light' | 'dark';
export type DailyGoal = 'minimum' | 'normal' | 'intense';

export const THEMES: readonly Theme[] = ['system', 'light', 'dark'];
export const DAILY_GOALS: readonly DailyGoal[] = ['minimum', 'normal', 'intense'];
export const SPEECH_RATE_MIN = 0.5;
export const SPEECH_RATE_MAX = 1.2;

/** Text size: sets the root font size, so everything sized in rem scales with it. */
export type TextSize = 'small' | 'normal' | 'large' | 'larger';
export const TEXT_SIZES: readonly TextSize[] = ['small', 'normal', 'large', 'larger'];
export const TEXT_SIZE_PERCENT: Record<TextSize, number> = {
  small: 93.75,
  normal: 100,
  large: 112.5,
  larger: 125,
};

/** On-the-ground mode: automatic from the departure date, or switched on / off by hand. */
export type GroundMode = 'auto' | 'on' | 'off';
export const GROUND_MODES: readonly GroundMode[] = ['auto', 'on', 'off'];

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface Settings {
  theme: Theme;
  dailyGoal: DailyGoal;
  showRomanization: boolean;
  /** Web Speech API rate; 1 is normal speed. */
  speechRate: number;
  departureDate: ISODate;
  /** Include cards where the word must be typed in Hangul (needs a Korean keyboard). */
  typingCards: boolean;
  /** Chosen Korean voice (`SpeechSynthesisVoice.voiceURI`); '' means the first Korean voice. */
  voiceURI: string;
  textSize: TextSize;
  /** Daily reminder through the Notifications API, at `reminderTime` (HH:MM, local). */
  reminderOn: boolean;
  reminderTime: string;
  /** Day of the last backup export or share; null when there has been none. */
  lastBackupOn: ISODate | null;
  /** False until the first-launch setup has been finished or skipped. */
  onboarded: boolean;
  groundMode: GroundMode;
  /** Last day of the exchange semester, shown in on-the-ground mode. */
  semesterEnd: ISODate;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  dailyGoal: 'normal',
  showRomanization: true,
  speechRate: 0.9,
  departureDate: '2027-02-25',
  typingCards: true,
  voiceURI: '',
  textSize: 'normal',
  reminderOn: false,
  reminderTime: '19:00',
  lastBackupOn: null,
  onboarded: false,
  groundMode: 'auto',
  semesterEnd: '2027-06-18',
};

/** All saved data, keyed by storage key. */
export type StoredData = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Turns anything (old data, an imported file, nothing at all) into valid Settings.
 * Each bad or missing field falls back to its default, so the app never crashes on load.
 */
export function sanitizeSettings(raw: unknown): Settings {
  const input = isRecord(raw) ? raw : {};
  const d = DEFAULT_SETTINGS;
  const rate = input.speechRate;
  return {
    theme: THEMES.includes(input.theme as Theme) ? (input.theme as Theme) : d.theme,
    dailyGoal: DAILY_GOALS.includes(input.dailyGoal as DailyGoal)
      ? (input.dailyGoal as DailyGoal)
      : d.dailyGoal,
    showRomanization:
      typeof input.showRomanization === 'boolean' ? input.showRomanization : d.showRomanization,
    speechRate:
      typeof rate === 'number' && Number.isFinite(rate)
        ? Math.min(SPEECH_RATE_MAX, Math.max(SPEECH_RATE_MIN, rate))
        : d.speechRate,
    departureDate: isValidISODate(input.departureDate) ? input.departureDate : d.departureDate,
    typingCards: typeof input.typingCards === 'boolean' ? input.typingCards : d.typingCards,
    voiceURI: typeof input.voiceURI === 'string' ? input.voiceURI.slice(0, 500) : d.voiceURI,
    textSize: TEXT_SIZES.includes(input.textSize as TextSize)
      ? (input.textSize as TextSize)
      : d.textSize,
    reminderOn: typeof input.reminderOn === 'boolean' ? input.reminderOn : d.reminderOn,
    reminderTime:
      typeof input.reminderTime === 'string' && TIME_PATTERN.test(input.reminderTime)
        ? input.reminderTime
        : d.reminderTime,
    lastBackupOn: isValidISODate(input.lastBackupOn) ? input.lastBackupOn : d.lastBackupOn,
    onboarded: typeof input.onboarded === 'boolean' ? input.onboarded : d.onboarded,
    groundMode: GROUND_MODES.includes(input.groundMode as GroundMode)
      ? (input.groundMode as GroundMode)
      : d.groundMode,
    semesterEnd: isValidISODate(input.semesterEnd) ? input.semesterEnd : d.semesterEnd,
  };
}

/**
 * Settings saved before the first-launch setup existed have no `onboarded` field. They
 * belong to someone already using the app, who should not see the setup again.
 */
export function wasSavedBeforeOnboarding(raw: unknown): boolean {
  return isRecord(raw) && Object.keys(raw).length > 0 && typeof raw.onboarded !== 'boolean';
}

/**
 * Upgrades saved data from an older schema version to the current one.
 * Version 1 is the first version, so there are no steps yet. Future example:
 *   if (fromVersion < 2) { data = { ...data, vocab: upgradeVocab(data.vocab) }; }
 */
export function migrate(data: StoredData, fromVersion: number): StoredData {
  void fromVersion;
  return data;
}

export interface BackupFile {
  app: typeof APP_ID;
  schemaVersion: number;
  exportedAt: string;
  data: StoredData;
}

export class BackupError extends Error {}

/** Checks an imported file and returns its data, migrated to the current schema. */
export function parseBackup(raw: unknown): StoredData {
  if (!isRecord(raw) || raw.app !== APP_ID) {
    throw new BackupError('This file is not a Hangeul Road backup.');
  }
  const version = raw.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new BackupError('This backup has no valid version number.');
  }
  if (version > SCHEMA_VERSION) {
    throw new BackupError(
      'This backup was made by a newer version of the app. Update the app, then import again.',
    );
  }
  if (!isRecord(raw.data)) {
    throw new BackupError('This backup contains no data.');
  }
  const data = migrate({ ...raw.data }, version);
  // Settings are validated here; later phases validate their own keys the same way.
  const rawSettings = data[STORAGE_KEYS.settings];
  data[STORAGE_KEYS.settings] = {
    ...sanitizeSettings(rawSettings),
    // A backup from before the setup screen comes from someone already using the app.
    ...(wasSavedBeforeOnboarding(rawSettings) && { onboarded: true }),
  };
  if (STORAGE_KEYS.hangul in data) {
    data[STORAGE_KEYS.hangul] = sanitizeHangulProgress(data[STORAGE_KEYS.hangul]);
  }
  if (STORAGE_KEYS.vocab in data) {
    data[STORAGE_KEYS.vocab] = sanitizeVocabProgress(data[STORAGE_KEYS.vocab]);
  }
  if (STORAGE_KEYS.activity in data) {
    data[STORAGE_KEYS.activity] = sanitizeActivity(data[STORAGE_KEYS.activity]);
  }
  if (STORAGE_KEYS.library in data) {
    data[STORAGE_KEYS.library] = sanitizeLibrary(data[STORAGE_KEYS.library]);
  }
  if (STORAGE_KEYS.grammar in data) {
    data[STORAGE_KEYS.grammar] = sanitizeGrammarProgress(data[STORAGE_KEYS.grammar]);
  }
  if (STORAGE_KEYS.phrases in data) {
    data[STORAGE_KEYS.phrases] = sanitizePhraseProgress(data[STORAGE_KEYS.phrases]);
  }
  if (STORAGE_KEYS.culture in data) {
    data[STORAGE_KEYS.culture] = sanitizeCultureProgress(data[STORAGE_KEYS.culture]);
  }
  if (STORAGE_KEYS.koreaGuide in data) {
    data[STORAGE_KEYS.koreaGuide] = sanitizeKoreaGuideProgress(data[STORAGE_KEYS.koreaGuide]);
  }
  return data;
}
