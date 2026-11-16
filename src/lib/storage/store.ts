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
import { todayISO } from '../date';
import { review, type Grade } from '../srs';
import { EMPTY_VOCAB_PROGRESS, sanitizeVocabProgress, type VocabProgress } from '../vocabProgress';
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

  vocab: VocabProgress;
  /** Records one review answer and reschedules the word. */
  gradeWord: (wordId: string, grade: Grade) => Promise<void>;
  addMyWord: (word: { korean: string; meaning: string; note?: string }) => Promise<void>;
  deleteMyWord: (wordId: string) => Promise<void>;
  setFocusDeck: (deckId: string | null) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => {
  const saveHangul = async (hangul: HangulProgress) => {
    set({ hangul });
    await setValue(STORAGE_KEYS.hangul, hangul);
  };

  const saveVocab = async (vocab: VocabProgress) => {
    set({ vocab });
    await setValue(STORAGE_KEYS.vocab, vocab);
  };

  return {
    hydrated: false,
    vocab: EMPTY_VOCAB_PROGRESS,
    settings: DEFAULT_SETTINGS,
    hangul: EMPTY_HANGUL_PROGRESS,

    hydrate: async () => {
      await ensureCurrentSchema();
      const settings = sanitizeSettings(await getValue(STORAGE_KEYS.settings));
      const hangul = sanitizeHangulProgress(await getValue(STORAGE_KEYS.hangul));
      const vocab = sanitizeVocabProgress(await getValue(STORAGE_KEYS.vocab));
      set({ settings, hangul, vocab, hydrated: true });
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

    gradeWord: (wordId, grade) => {
      const vocab = get().vocab;
      const card = review(vocab.cards[wordId], grade, todayISO());
      return saveVocab({ ...vocab, cards: { ...vocab.cards, [wordId]: card } });
    },

    addMyWord: (word) => {
      const vocab = get().vocab;
      const id = `my-${Date.now().toString(36)}-${vocab.myWords.length}`;
      return saveVocab(
        sanitizeVocabProgress({ ...vocab, myWords: [...vocab.myWords, { id, ...word }] }),
      );
    },

    deleteMyWord: (wordId) => {
      const vocab = get().vocab;
      const cards = { ...vocab.cards };
      delete cards[wordId];
      return saveVocab({
        ...vocab,
        cards,
        myWords: vocab.myWords.filter((w) => w.id !== wordId),
      });
    },

    setFocusDeck: (deckId) => saveVocab({ ...get().vocab, focusDeck: deckId }),
  };
});
