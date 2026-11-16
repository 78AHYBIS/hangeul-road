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

export const APP_ID = 'hangeul-road';
export const SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
  settings: 'settings',
  hangul: 'hangul',
  vocab: 'vocab',
  activity: 'activity',
} as const;

export type Theme = 'system' | 'light' | 'dark';
export type DailyGoal = 'minimum' | 'normal' | 'intense';

export const THEMES: readonly Theme[] = ['system', 'light', 'dark'];
export const DAILY_GOALS: readonly DailyGoal[] = ['minimum', 'normal', 'intense'];
export const SPEECH_RATE_MIN = 0.5;
export const SPEECH_RATE_MAX = 1.2;

export interface Settings {
  theme: Theme;
  dailyGoal: DailyGoal;
  showRomanization: boolean;
  /** Web Speech API rate; 1 is normal speed. */
  speechRate: number;
  departureDate: ISODate;
  /** Include cards where the word must be typed in Hangul (needs a Korean keyboard). */
  typingCards: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  dailyGoal: 'normal',
  showRomanization: true,
  speechRate: 0.9,
  departureDate: '2027-02-25',
  typingCards: true,
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
  };
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
  data[STORAGE_KEYS.settings] = sanitizeSettings(data[STORAGE_KEYS.settings]);
  if (STORAGE_KEYS.hangul in data) {
    data[STORAGE_KEYS.hangul] = sanitizeHangulProgress(data[STORAGE_KEYS.hangul]);
  }
  if (STORAGE_KEYS.vocab in data) {
    data[STORAGE_KEYS.vocab] = sanitizeVocabProgress(data[STORAGE_KEYS.vocab]);
  }
  if (STORAGE_KEYS.activity in data) {
    data[STORAGE_KEYS.activity] = sanitizeActivity(data[STORAGE_KEYS.activity]);
  }
  return data;
}
