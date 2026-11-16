/**
 * App state (Zustand). Components read state with `useAppStore(selector)`.
 * Every change is written to IndexedDB so it survives a reload.
 */
import { create } from 'zustand';
import { ensureCurrentSchema, getValue, setValue } from './db';
import { DEFAULT_SETTINGS, STORAGE_KEYS, sanitizeSettings, type Settings } from './schema';

interface AppState {
  /** False until saved data has been loaded from IndexedDB. */
  hydrated: boolean;
  settings: Settings;
  /** Loads saved data into memory. Called at startup and after an import. */
  hydrate: () => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  settings: DEFAULT_SETTINGS,

  hydrate: async () => {
    await ensureCurrentSchema();
    const settings = sanitizeSettings(await getValue(STORAGE_KEYS.settings));
    set({ settings, hydrated: true });
  },

  updateSettings: async (patch) => {
    const settings = sanitizeSettings({ ...get().settings, ...patch });
    set({ settings });
    await setValue(STORAGE_KEYS.settings, settings);
  },
}));
