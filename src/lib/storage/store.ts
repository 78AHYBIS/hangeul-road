/**
 * App state (Zustand). Components read state with `useAppStore(selector)`.
 * Every change is written to IndexedDB so it survives a reload.
 */
import { create } from 'zustand';
import {
  EMPTY_HANGUL_PROGRESS,
  addReadingSpeedEntry,
  recordLetterResults,
  sanitizeHangulProgress,
  type HangulProgress,
  type ReadingSpeedEntry,
} from '../hangulProgress';
import { ensureCurrentSchema, getValue, setValue } from './db';
import { DEFAULT_SETTINGS, STORAGE_KEYS, sanitizeSettings, type Settings } from './schema';

interface AppState {
  /** False until saved data has been loaded from IndexedDB. */
  hydrated: boolean;
  settings: Settings;
  hangul: HangulProgress;
  /** Loads saved data into memory. Called at startup and after an import. */
  hydrate: () => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  /** Records one drill answer for each of the given letters. */
  recordLetters: (letters: string[], correct: boolean) => Promise<void>;
  addReadingSpeed: (entry: ReadingSpeedEntry) => Promise<void>;
  markLessonDone: (lessonId: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => {
  const saveHangul = async (hangul: HangulProgress) => {
    set({ hangul });
    await setValue(STORAGE_KEYS.hangul, hangul);
  };

  return {
    hydrated: false,
    settings: DEFAULT_SETTINGS,
    hangul: EMPTY_HANGUL_PROGRESS,

    hydrate: async () => {
      await ensureCurrentSchema();
      const settings = sanitizeSettings(await getValue(STORAGE_KEYS.settings));
      const hangul = sanitizeHangulProgress(await getValue(STORAGE_KEYS.hangul));
      set({ settings, hangul, hydrated: true });
    },

    updateSettings: async (patch) => {
      const settings = sanitizeSettings({ ...get().settings, ...patch });
      set({ settings });
      await setValue(STORAGE_KEYS.settings, settings);
    },

    recordLetters: (letters, correct) =>
      saveHangul(recordLetterResults(get().hangul, letters, correct)),

    addReadingSpeed: (entry) => saveHangul(addReadingSpeedEntry(get().hangul, entry)),

    markLessonDone: async (lessonId) => {
      const hangul = get().hangul;
      if (hangul.lessonsDone.includes(lessonId)) return;
      await saveHangul({ ...hangul, lessonsDone: [...hangul.lessonsDone, lessonId] });
    },
  };
});
