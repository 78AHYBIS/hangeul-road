import { beforeEach, describe, expect, it } from 'vitest';
import { createBackup, restoreBackup } from './backup';
import { readAll, replaceAll, setValue } from './db';
import {
  BackupError,
  DEFAULT_SETTINGS,
  SCHEMA_VERSION,
  sanitizeSettings,
  type Settings,
} from './schema';
import { useAppStore } from './store';

const custom: Settings = {
  theme: 'dark',
  dailyGoal: 'intense',
  showRomanization: false,
  speechRate: 0.7,
  departureDate: '2027-02-20',
};

/** Simulates closing and reopening the app: memory is wiped, IndexedDB is kept. */
function forgetInMemoryState() {
  useAppStore.setState({ hydrated: false, settings: DEFAULT_SETTINGS });
}

beforeEach(async () => {
  await replaceAll({});
  forgetInMemoryState();
});

describe('sanitizeSettings', () => {
  it('returns defaults for missing or junk input', () => {
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings('junk')).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({ theme: 'neon', departureDate: '2027-02-31' })).toEqual(
      DEFAULT_SETTINGS,
    );
  });

  it('keeps valid fields and clamps the speech rate', () => {
    expect(sanitizeSettings(custom)).toEqual(custom);
    expect(sanitizeSettings({ speechRate: 9 }).speechRate).toBe(1.2);
    expect(sanitizeSettings({ speechRate: 0 }).speechRate).toBe(0.5);
  });
});

describe('settings persistence', () => {
  it('starts with defaults on a fresh install', async () => {
    await useAppStore.getState().hydrate();
    expect(useAppStore.getState().hydrated).toBe(true);
    expect(useAppStore.getState().settings).toEqual(DEFAULT_SETTINGS);
  });

  it('survives a reload', async () => {
    await useAppStore.getState().hydrate();
    await useAppStore.getState().updateSettings(custom);
    forgetInMemoryState();
    await useAppStore.getState().hydrate();
    expect(useAppStore.getState().settings).toEqual(custom);
  });

  it('updates one field without touching the others', async () => {
    await useAppStore.getState().hydrate();
    await useAppStore.getState().updateSettings({ dailyGoal: 'minimum' });
    expect(useAppStore.getState().settings).toEqual({ ...DEFAULT_SETTINGS, dailyGoal: 'minimum' });
  });
});

describe('export / import', () => {
  it('restores exactly the same state', async () => {
    await useAppStore.getState().hydrate();
    await useAppStore.getState().updateSettings(custom);
    // A key from a future phase must round-trip too, untouched.
    await setValue('futureFeature', { cards: [1, 2, 3] });
    const before = await readAll();

    const fileText = JSON.stringify(await createBackup());

    await replaceAll({}); // new phone
    forgetInMemoryState();
    await restoreBackup(fileText);
    await useAppStore.getState().hydrate();

    expect(await readAll()).toEqual(before);
    expect(useAppStore.getState().settings).toEqual(custom);
  });

  it('writes the app id and schema version into the file', async () => {
    const backup = await createBackup(new Date('2026-11-16T10:00:00Z'));
    expect(backup).toMatchObject({
      app: 'hangeul-road',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: '2026-11-16T10:00:00.000Z',
    });
  });

  it('rejects bad files and keeps existing data', async () => {
    await useAppStore.getState().hydrate();
    await useAppStore.getState().updateSettings(custom);
    const before = await readAll();

    const badFiles = [
      'not json',
      '{}',
      JSON.stringify({ app: 'other-app', schemaVersion: 1, data: {} }),
      JSON.stringify({ app: 'hangeul-road', schemaVersion: SCHEMA_VERSION + 1, data: {} }),
      JSON.stringify({ app: 'hangeul-road', schemaVersion: 1 }),
    ];
    for (const text of badFiles) {
      await expect(restoreBackup(text)).rejects.toBeInstanceOf(BackupError);
    }
    expect(await readAll()).toEqual(before);
  });

  it('repairs invalid settings inside an otherwise valid backup', async () => {
    await restoreBackup(
      JSON.stringify({
        app: 'hangeul-road',
        schemaVersion: 1,
        exportedAt: 'x',
        data: { settings: { theme: 'dark', dailyGoal: 'extreme' } },
      }),
    );
    await useAppStore.getState().hydrate();
    expect(useAppStore.getState().settings).toEqual({ ...DEFAULT_SETTINGS, theme: 'dark' });
  });
});
