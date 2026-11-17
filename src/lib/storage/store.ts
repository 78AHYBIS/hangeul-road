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
import {
  EMPTY_ACTIVITY,
  sanitizeActivity,
  updateDay,
  type Activity,
  type DayLog,
} from '../activity';
import { todayISO, type ISODate } from '../date';
import { review, type Grade } from '../srs';
import {
  EMPTY_LIBRARY,
  addCustom,
  addUnits,
  removeCustom,
  removeUnit,
  sanitizeLibrary,
  setNotes,
  setStatus,
  toggleActive,
  toggleUnit,
  unitMarker,
  type CustomResource,
  type LibraryProgress,
  type ResourceStatus,
} from '../libraryProgress';
import { EMPTY_VOCAB_PROGRESS, sanitizeVocabProgress, type VocabProgress } from '../vocabProgress';
import {
  EMPTY_GRAMMAR_PROGRESS,
  addDone,
  sanitizeGrammarProgress,
  type GrammarProgress,
} from '../grammarProgress';
import {
  EMPTY_PHRASE_PROGRESS,
  sanitizePhraseProgress,
  toggleStar,
  type PhraseProgress,
} from '../phraseProgress';
import { sanitizeIntro, type IntroDetails } from '../selfIntro';
import {
  EMPTY_CULTURE_PROGRESS,
  cardMarker,
  quizMarker,
  sanitizeCultureProgress,
  setRead,
  type CultureProgress,
} from '../cultureProgress';
import { ensureCurrentSchema, getValue, setValue } from './db';
import {
  type DailyGoal,
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  sanitizeSettings,
  type Settings,
} from './schema';

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

  activity: Activity;
  /** Ticks or unticks one of today's tasks. */
  toggleTask: (taskId: string) => Promise<void>;
  /** Picks today's day size (minimum / normal / intense). */
  setDaySize: (size: DailyGoal) => Promise<void>;
  setStartDate: (date: ISODate | null) => Promise<void>;
  /** Counts one drill answer that is not tied to a letter (number trainer). */
  logDrill: (correct: boolean) => Promise<void>;

  library: LibraryProgress;
  setResourceStatus: (id: string, status: ResourceStatus) => Promise<void>;
  setResourceNotes: (id: string, notes: string) => Promise<void>;
  /** Makes a course active (or not). Returns false if two are already active. */
  toggleActiveCourse: (id: string) => Promise<boolean>;
  addCourseUnits: (id: string, titles: string[]) => Promise<void>;
  /** Ticks or unticks a unit as done today; a ticked unit counts as a task for the streak. */
  toggleCourseUnit: (id: string, unitId: string) => Promise<void>;
  removeCourseUnit: (id: string, unitId: string) => Promise<void>;
  /** Adds a resource of the user's own and returns its id. */
  addCustomResource: (resource: Omit<CustomResource, 'id'>) => Promise<string>;
  removeCustomResource: (id: string) => Promise<void>;

  grammar: GrammarProgress;
  /**
   * Saves a finished practice session (score) and marks the lesson done. The first
   * time, it counts as today's lesson; after that, as today's practice drill.
   */
  finishGrammarPractice: (lessonId: string, correct: number, total: number) => Promise<void>;
  /** Marks a grammar lesson done without practice. */
  markGrammarDone: (lessonId: string) => Promise<void>;

  phrases: PhraseProgress;
  /** Saves a finished pack quiz and marks the pack done (same rules as grammar practice). */
  finishPackQuiz: (packId: string, correct: number, total: number) => Promise<void>;
  markPackDone: (packId: string) => Promise<void>;
  toggleStarPhrase: (phraseId: string) => Promise<void>;
  setIntro: (details: IntroDetails) => Promise<void>;

  culture: CultureProgress;
  /**
   * Marks a culture card read today (logs `culture:<id>` so Today ticks it and the streak
   * counts it), or unread (removes both).
   */
  setCardRead: (cardId: string, read: boolean) => Promise<void>;
  /** Saves a finished topic quiz and logs it for today. */
  finishCultureQuiz: (topicId: string, correct: number, total: number) => Promise<void>;
}

// Used to estimate study time: the gap between two actions, capped at one minute.
let lastActionAt = 0;
function secondsSinceLastAction(): number {
  const now = Date.now();
  const gap = lastActionAt ? (now - lastActionAt) / 1000 : 10;
  lastActionAt = now;
  return Math.round(Math.min(60, Math.max(1, gap)));
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

  /** Adds to today's log. Every study action goes through here. */
  const logToday = async (change: (day: DayLog) => DayLog) => {
    const seconds = secondsSinceLastAction();
    const activity = updateDay(get().activity, todayISO(), (day) => {
      const next = change(day);
      return { ...next, seconds: next.seconds + seconds };
    });
    set({ activity });
    await setValue(STORAGE_KEYS.activity, activity);
  };
  const saveLibrary = async (library: LibraryProgress) => {
    set({ library });
    await setValue(STORAGE_KEYS.library, library);
  };
  const saveActivity = async (activity: Activity) => {
    set({ activity });
    await setValue(STORAGE_KEYS.activity, activity);
  };
  const saveGrammar = async (grammar: GrammarProgress) => {
    set({ grammar });
    await setValue(STORAGE_KEYS.grammar, grammar);
  };
  const savePhrases = async (phrases: PhraseProgress) => {
    set({ phrases });
    await setValue(STORAGE_KEYS.phrases, phrases);
  };
  const saveCulture = async (culture: CultureProgress) => {
    set({ culture });
    await setValue(STORAGE_KEYS.culture, culture);
  };
  /**
   * Notes a finished lesson in today's ticked tasks, as `lesson:<id>`. The Today plan
   * then keeps showing that lesson (ticked) for the rest of the day, and it counts
   * for the streak.
   */
  const tickToday = (marker: string) =>
    saveActivity(
      updateDay(get().activity, todayISO(), (d) => ({
        ...d,
        tasksDone: d.tasksDone.includes(marker) ? d.tasksDone : [...d.tasksDone, marker],
      })),
    );

  return {
    hydrated: false,
    vocab: EMPTY_VOCAB_PROGRESS,
    activity: EMPTY_ACTIVITY,
    settings: DEFAULT_SETTINGS,
    hangul: EMPTY_HANGUL_PROGRESS,
    library: EMPTY_LIBRARY,
    grammar: EMPTY_GRAMMAR_PROGRESS,
    phrases: EMPTY_PHRASE_PROGRESS,
    culture: EMPTY_CULTURE_PROGRESS,

    hydrate: async () => {
      await ensureCurrentSchema();
      const settings = sanitizeSettings(await getValue(STORAGE_KEYS.settings));
      const hangul = sanitizeHangulProgress(await getValue(STORAGE_KEYS.hangul));
      const vocab = sanitizeVocabProgress(await getValue(STORAGE_KEYS.vocab));
      const activity = sanitizeActivity(await getValue(STORAGE_KEYS.activity));
      const library = sanitizeLibrary(await getValue(STORAGE_KEYS.library));
      const grammar = sanitizeGrammarProgress(await getValue(STORAGE_KEYS.grammar));
      const phrases = sanitizePhraseProgress(await getValue(STORAGE_KEYS.phrases));
      const culture = sanitizeCultureProgress(await getValue(STORAGE_KEYS.culture));
      set({
        settings,
        hangul,
        vocab,
        activity,
        library,
        grammar,
        phrases,
        culture,
        hydrated: true,
      });
    },

    updateSettings: async (patch) => {
      const settings = sanitizeSettings({ ...get().settings, ...patch });
      set({ settings });
      await setValue(STORAGE_KEYS.settings, settings);
    },

    recordLetters: async (letters, correct) => {
      await saveHangul(recordLetterResults(get().hangul, letters, correct));
      await logToday((d) => ({
        ...d,
        answers: d.answers + 1,
        correct: d.correct + (correct ? 1 : 0),
      }));
    },

    addReadingSpeed: (entry) => saveHangul(addReadingSpeedEntry(get().hangul, entry)),

    markLessonDone: async (lessonId) => {
      const hangul = get().hangul;
      if (hangul.lessonsDone.includes(lessonId)) return;
      await saveHangul({ ...hangul, lessonsDone: [...hangul.lessonsDone, lessonId] });
      await tickToday(`lesson:${lessonId}`);
    },

    gradeWord: async (wordId, grade) => {
      const vocab = get().vocab;
      const wasNew = !vocab.cards[wordId];
      const card = review(vocab.cards[wordId], grade, todayISO());
      await saveVocab({ ...vocab, cards: { ...vocab.cards, [wordId]: card } });
      await logToday((d) => ({
        ...d,
        reviews: d.reviews + 1,
        reviewsCorrect: d.reviewsCorrect + (grade === 'again' ? 0 : 1),
        newWords: d.newWords + (wasNew ? 1 : 0),
      }));
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

    toggleTask: (taskId) =>
      saveActivity(
        updateDay(get().activity, todayISO(), (d) => ({
          ...d,
          tasksDone: d.tasksDone.includes(taskId)
            ? d.tasksDone.filter((id) => id !== taskId)
            : [...d.tasksDone, taskId],
        })),
      ),

    setDaySize: (size) =>
      saveActivity(updateDay(get().activity, todayISO(), (d) => ({ ...d, size }))),

    setStartDate: (date) => saveActivity({ ...get().activity, startDate: date }),

    logDrill: (correct) =>
      logToday((d) => ({ ...d, answers: d.answers + 1, correct: d.correct + (correct ? 1 : 0) })),

    setResourceStatus: (id, status) => saveLibrary(setStatus(get().library, id, status)),

    setResourceNotes: (id, notes) => saveLibrary(setNotes(get().library, id, notes)),

    toggleActiveCourse: async (id) => {
      const before = get().library;
      const after = toggleActive(before, id);
      if (after === before) return false;
      await saveLibrary(after);
      return true;
    },

    addCourseUnits: (id, titles) => saveLibrary(addUnits(get().library, id, titles)),

    toggleCourseUnit: async (id, unitId) => {
      const today = todayISO();
      const library = toggleUnit(get().library, id, unitId, today);
      await saveLibrary(library);
      const done = library.items[id]?.units.find((u) => u.id === unitId)?.doneOn === today;
      const marker = unitMarker(id, unitId);
      await saveActivity(
        updateDay(get().activity, today, (d) => ({
          ...d,
          tasksDone: done
            ? [...new Set([...d.tasksDone, marker])]
            : d.tasksDone.filter((t) => t !== marker),
        })),
      );
    },

    removeCourseUnit: (id, unitId) => saveLibrary(removeUnit(get().library, id, unitId)),

    addCustomResource: async (resource) => {
      const id = `custom-${Date.now().toString(36)}`;
      await saveLibrary(addCustom(get().library, { ...resource, id }));
      return id;
    },

    removeCustomResource: (id) => saveLibrary(removeCustom(get().library, id)),

    finishGrammarPractice: async (lessonId, correct, total) => {
      const grammar = get().grammar;
      const first = !grammar.done.includes(lessonId);
      await saveGrammar({
        done: addDone(grammar.done, lessonId),
        results: { ...grammar.results, [lessonId]: { correct, total, date: todayISO() } },
      });
      await tickToday(first ? `lesson:${lessonId}` : `drill:grammar:${lessonId}`);
    },

    markGrammarDone: async (lessonId) => {
      const grammar = get().grammar;
      if (grammar.done.includes(lessonId)) return;
      await saveGrammar({ ...grammar, done: addDone(grammar.done, lessonId) });
      await tickToday(`lesson:${lessonId}`);
    },

    finishPackQuiz: async (packId, correct, total) => {
      const phrases = get().phrases;
      const first = !phrases.done.includes(packId);
      await savePhrases({
        ...phrases,
        done: addDone(phrases.done, packId),
        results: { ...phrases.results, [packId]: { correct, total, date: todayISO() } },
      });
      await tickToday(first ? `lesson:${packId}` : `drill:quiz:${packId}`);
    },

    markPackDone: async (packId) => {
      const phrases = get().phrases;
      if (phrases.done.includes(packId)) return;
      await savePhrases({ ...phrases, done: addDone(phrases.done, packId) });
      await tickToday(`lesson:${packId}`);
    },

    toggleStarPhrase: (phraseId) => savePhrases(toggleStar(get().phrases, phraseId)),

    setIntro: (details) => savePhrases({ ...get().phrases, intro: sanitizeIntro(details) }),

    setCardRead: async (cardId, read) => {
      const today = todayISO();
      await saveCulture(setRead(get().culture, cardId, read, today));
      const marker = cardMarker(cardId);
      await saveActivity(
        updateDay(get().activity, today, (d) => ({
          ...d,
          tasksDone: read
            ? [...new Set([...d.tasksDone, marker])]
            : d.tasksDone.filter((t) => t !== marker),
        })),
      );
    },

    finishCultureQuiz: async (topicId, correct, total) => {
      const culture = get().culture;
      await saveCulture({
        ...culture,
        results: { ...culture.results, [topicId]: { correct, total, date: todayISO() } },
      });
      await tickToday(quizMarker(topicId));
    },
  };
});
