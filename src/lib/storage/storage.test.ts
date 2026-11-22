import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_HANGUL_PROGRESS } from '../hangulProgress';
import { EMPTY_ACTIVITY } from '../activity';
import { EMPTY_VOCAB_PROGRESS } from '../vocabProgress';
import { EMPTY_LIBRARY } from '../libraryProgress';
import { EMPTY_GRAMMAR_PROGRESS } from '../grammarProgress';
import { EMPTY_PHRASE_PROGRESS } from '../phraseProgress';
import { EMPTY_CULTURE_PROGRESS } from '../cultureProgress';
import { EMPTY_KOREA_GUIDE_PROGRESS } from '../koreaGuideProgress';
import { todayISO } from '../date';
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
  typingCards: false,
  voiceURI: 'com.apple.voice.premium.ko-KR.Yuna',
  textSize: 'large',
  reminderOn: true,
  reminderTime: '07:30',
  lastBackupOn: '2026-11-20',
  onboarded: true,
  groundMode: 'on',
  semesterEnd: '2027-06-20',
};

/** Simulates closing and reopening the app: memory is wiped, IndexedDB is kept. */
function forgetInMemoryState() {
  useAppStore.setState({
    hydrated: false,
    settings: DEFAULT_SETTINGS,
    hangul: EMPTY_HANGUL_PROGRESS,
    vocab: EMPTY_VOCAB_PROGRESS,
    activity: EMPTY_ACTIVITY,
    library: EMPTY_LIBRARY,
    grammar: EMPTY_GRAMMAR_PROGRESS,
    phrases: EMPTY_PHRASE_PROGRESS,
    culture: EMPTY_CULTURE_PROGRESS,
    koreaGuide: EMPTY_KOREA_GUIDE_PROGRESS,
  });
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

  it('falls back to defaults for bad Phase 8 fields', () => {
    const bad = sanitizeSettings({
      voiceURI: 42,
      textSize: 'huge',
      reminderTime: '25:00',
      lastBackupOn: 'yesterday',
      groundMode: 'maybe',
      semesterEnd: '2027-13-01',
    });
    expect(bad).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({ reminderTime: '7:30' }).reminderTime).toBe('19:00');
  });
});

describe('first-launch setup', () => {
  it('is shown on a fresh install', async () => {
    await useAppStore.getState().hydrate();
    expect(useAppStore.getState().settings.onboarded).toBe(false);
  });

  it('is skipped for someone who used the app before it existed', async () => {
    await setValue('settings', { theme: 'dark', dailyGoal: 'normal' });
    await useAppStore.getState().hydrate();
    expect(useAppStore.getState().settings.onboarded).toBe(true);
  });

  it('is skipped when there is study activity but no saved settings', async () => {
    await setValue('activity', {
      startDate: null,
      days: { '2026-11-20': { reviews: 3 } },
    });
    await useAppStore.getState().hydrate();
    expect(useAppStore.getState().settings.onboarded).toBe(true);
  });

  it('saves the answers and marks letter lessons done for someone who knows Hangul', async () => {
    await useAppStore.getState().hydrate();
    await useAppStore.getState().completeOnboarding({
      startDate: '2026-11-22',
      departureDate: '2027-02-26',
      dailyGoal: 'intense',
      knowsHangul: true,
    });
    forgetInMemoryState();
    await useAppStore.getState().hydrate();
    const state = useAppStore.getState();
    expect(state.settings).toMatchObject({
      onboarded: true,
      departureDate: '2027-02-26',
      dailyGoal: 'intense',
    });
    expect(state.activity.startDate).toBe('2026-11-22');
    expect(state.hangul.lessonsDone.length).toBe(5);
    // Setting up is not studying: nothing is logged for today.
    expect(state.activity.days[todayISO()]).toBeUndefined();
  });

  it('leaves letter lessons alone for a complete beginner', async () => {
    await useAppStore.getState().hydrate();
    await useAppStore.getState().completeOnboarding({
      startDate: '2026-11-22',
      departureDate: '2027-02-25',
      dailyGoal: 'normal',
      knowsHangul: false,
    });
    expect(useAppStore.getState().hangul.lessonsDone).toEqual([]);
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
    // A backup from before the setup screen existed also skips the setup.
    expect(useAppStore.getState().settings).toEqual({
      ...DEFAULT_SETTINGS,
      theme: 'dark',
      onboarded: true,
    });
  });
});

describe('last backup date', () => {
  it('is saved by recordBackup and travels inside the next backup file', async () => {
    await useAppStore.getState().hydrate();
    await useAppStore.getState().recordBackup();
    expect(useAppStore.getState().settings.lastBackupOn).toBe(todayISO());
    const file = await createBackup();
    expect((file.data.settings as Settings).lastBackupOn).toBe(todayISO());
  });
});

describe('hangul progress persistence', () => {
  it('survives a reload and a backup round trip', async () => {
    await useAppStore.getState().hydrate();
    await useAppStore.getState().recordLetters(['ㄱ', 'ㅏ'], true);
    await useAppStore.getState().recordLetters(['ㄱ'], false);
    await useAppStore.getState().markLessonDone('lesson-a');
    await useAppStore.getState().markLessonDone('lesson-a');
    await useAppStore
      .getState()
      .addReadingSpeed({ date: '2026-11-16', perMinute: 40, items: 20, seconds: 30 });
    const saved = useAppStore.getState().hangul;
    expect(saved.letters['ㄱ']).toEqual({ seen: 2, correct: 1, recent: [true, false] });
    expect(saved.lessonsDone).toEqual(['lesson-a']);

    const fileText = JSON.stringify(await createBackup());
    await replaceAll({});
    forgetInMemoryState();
    await restoreBackup(fileText);
    await useAppStore.getState().hydrate();
    expect(useAppStore.getState().hangul).toEqual(saved);
  });
});

describe('vocabulary progress persistence', () => {
  it('survives a reload and a backup round trip', async () => {
    const store = () => useAppStore.getState();
    await store().hydrate();
    await store().gradeWord('vocab-greetings-네', 'good');
    await store().addMyWord({ korean: ' 고양이 ', meaning: 'cat', note: '' });
    await store().setFocusDeck('deck-food');
    const myId = store().vocab.myWords[0]!.id;
    await store().gradeWord(myId, 'again');
    const saved = store().vocab;
    expect(saved.cards['vocab-greetings-네']).toMatchObject({ state: 'review', interval: 1 });
    expect(saved.myWords).toEqual([{ id: myId, korean: '고양이', meaning: 'cat' }]);

    const fileText = JSON.stringify(await createBackup());
    await replaceAll({});
    forgetInMemoryState();
    await restoreBackup(fileText);
    await store().hydrate();
    expect(store().vocab).toEqual(saved);

    await store().deleteMyWord(myId);
    expect(store().vocab.myWords).toEqual([]);
    expect(store().vocab.cards[myId]).toBeUndefined();
  });
});

describe('activity log', () => {
  it('records study actions for today and survives a backup round trip', async () => {
    const store = () => useAppStore.getState();
    await store().hydrate();
    await store().gradeWord('vocab-greetings-네', 'good');
    await store().gradeWord('vocab-greetings-네', 'again');
    await store().recordLetters(['ㄱ', 'ㅏ'], true);
    await store().logDrill(false);
    await store().toggleTask('external:duolingo');
    await store().toggleTask('reviews');
    await store().toggleTask('reviews');
    await store().setDaySize('minimum');
    const day = Object.values(store().activity.days)[0]!;
    expect(day).toMatchObject({
      reviews: 2,
      reviewsCorrect: 1,
      newWords: 1,
      answers: 2,
      correct: 1,
      tasksDone: ['external:duolingo'],
      size: 'minimum',
    });
    expect(day.seconds).toBeGreaterThan(0);

    const saved = store().activity;
    const fileText = JSON.stringify(await createBackup());
    await replaceAll({});
    forgetInMemoryState();
    await restoreBackup(fileText);
    await store().hydrate();
    expect(store().activity).toEqual(saved);
  });
});

describe('library progress', () => {
  it('saves status, notes, active course and units, and survives a backup round trip', async () => {
    const store = () => useAppStore.getState();
    await store().hydrate();
    expect(await store().toggleActiveCourse('res-gobilly-youtube')).toBe(true);
    expect(await store().toggleActiveCourse('res-coursera-first-step')).toBe(true);
    expect(await store().toggleActiveCourse('res-ttmik')).toBe(false);
    await store().addCourseUnits('res-gobilly-youtube', ['Lesson 1', 'Lesson 2']);
    await store().setResourceNotes('res-gobilly-youtube', 'Watch at 1.25x');
    await store().setResourceStatus('res-anki', 'dropped');
    const id = await store().addCustomResource({
      name: 'Campus Korean class',
      url: 'https://example.com',
      type: 'course',
      cost: 'free',
      skills: ['speaking'],
      description: '',
    });
    expect(id).toMatch(/^custom-/);

    // Ticking a unit is logged for today, so it counts towards the streak.
    await store().toggleCourseUnit('res-gobilly-youtube', 'u1');
    expect(store().activity.days[todayISO()]!.tasksDone).toEqual(['unit:res-gobilly-youtube:u1']);
    await store().toggleCourseUnit('res-gobilly-youtube', 'u1');
    expect(store().activity.days[todayISO()]!.tasksDone).toEqual([]);
    await store().toggleCourseUnit('res-gobilly-youtube', 'u1');

    const saved = store().library;
    expect(saved.active).toEqual(['res-gobilly-youtube', 'res-coursera-first-step']);
    expect(saved.items['res-gobilly-youtube']).toMatchObject({
      status: 'in-progress',
      notes: 'Watch at 1.25x',
      units: [
        { id: 'u1', title: 'Lesson 1', doneOn: todayISO() },
        { id: 'u2', title: 'Lesson 2', doneOn: null },
      ],
    });

    forgetInMemoryState();
    await store().hydrate();
    expect(store().library).toEqual(saved);

    const fileText = JSON.stringify(await createBackup());
    await replaceAll({});
    forgetInMemoryState();
    await restoreBackup(fileText);
    await store().hydrate();
    expect(store().library).toEqual(saved);
  });
});

describe('grammar and phrase progress', () => {
  it('saves lessons, scores, stars and the introduction, and survives a backup round trip', async () => {
    const store = () => useAppStore.getState();
    const today = todayISO();
    await store().hydrate();

    // The first practice finishes the lesson and counts as today's lesson.
    await store().finishGrammarPractice('grammar-01-word-order', 5, 6);
    // Practising it again counts as today's drill instead.
    await store().finishGrammarPractice('grammar-01-word-order', 6, 6);
    await store().markGrammarDone('grammar-02-copula');
    await store().finishPackQuiz('phrases-cafe', 4, 6);
    await store().markPackDone('phrases-dorm');
    await store().toggleStarPhrase('phrase-cafe-01');
    await store().toggleStarPhrase('phrase-food-12');
    await store().toggleStarPhrase('phrase-cafe-01');
    await store().setIntro({
      name: '아이다르',
      country: '카자흐스탄',
      university: '유니스트',
      exchange: true,
      major: '정보시스템',
      hobbies: ['여행', '요리', '축구'],
    });

    expect(store().grammar).toEqual({
      done: ['grammar-01-word-order', 'grammar-02-copula'],
      results: { 'grammar-01-word-order': { correct: 6, total: 6, date: today } },
    });
    expect(store().phrases.done).toEqual(['phrases-cafe', 'phrases-dorm']);
    expect(store().phrases.starred).toEqual(['phrase-food-12']);
    expect(store().phrases.intro.hobbies).toEqual(['여행', '요리']);
    expect(store().activity.days[today]!.tasksDone).toEqual([
      'lesson:grammar-01-word-order',
      'drill:grammar:grammar-01-word-order',
      'lesson:grammar-02-copula',
      'lesson:phrases-cafe',
      'lesson:phrases-dorm',
    ]);

    const grammar = store().grammar;
    const phrases = store().phrases;
    forgetInMemoryState();
    await store().hydrate();
    expect(store().grammar).toEqual(grammar);
    expect(store().phrases).toEqual(phrases);

    const fileText = JSON.stringify(await createBackup());
    await replaceAll({});
    forgetInMemoryState();
    await restoreBackup(fileText);
    await store().hydrate();
    expect(store().grammar).toEqual(grammar);
    expect(store().phrases).toEqual(phrases);
  });

  it("notes a finished Hangul lesson in today's ticks, so Today keeps it in place", async () => {
    const store = () => useAppStore.getState();
    await store().hydrate();
    await store().markLessonDone('hangul-lesson-basic-vowels');
    await store().markLessonDone('hangul-lesson-basic-vowels');
    expect(store().activity.days[todayISO()]!.tasksDone).toEqual([
      'lesson:hangul-lesson-basic-vowels',
    ]);
  });

  it('cleans bad grammar and phrase data from a backup instead of failing', async () => {
    await restoreBackup(
      JSON.stringify({
        app: 'hangeul-road',
        schemaVersion: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        data: {
          grammar: { done: ['grammar-01-word-order', 7, ''], results: { x: { total: 'a' } } },
          phrases: { starred: 'nope', intro: { name: 42, hobbies: ['독서', '독서'] } },
        },
      }),
    );
    await useAppStore.getState().hydrate();
    expect(useAppStore.getState().grammar).toEqual({
      done: ['grammar-01-word-order'],
      results: {},
    });
    expect(useAppStore.getState().phrases.starred).toEqual([]);
    expect(useAppStore.getState().phrases.intro).toMatchObject({ name: '', hobbies: ['독서'] });
  });
});

describe('culture progress', () => {
  it('saves read cards and quiz scores, logs them for today, and survives a backup', async () => {
    const store = () => useAppStore.getState();
    const today = todayISO();
    await store().hydrate();

    await store().setCardRead('culture-bowing', true);
    await store().setCardRead('culture-titles', true);
    await store().setCardRead('culture-titles', false);
    await store().finishCultureQuiz('culture-topic-respect', 3, 4);

    expect(store().culture).toEqual({
      read: { 'culture-bowing': today },
      results: { 'culture-topic-respect': { correct: 3, total: 4, date: today } },
    });
    expect(store().activity.days[today]!.tasksDone).toEqual([
      'culture:culture-bowing',
      'culture:quiz:culture-topic-respect',
    ]);

    const culture = store().culture;
    forgetInMemoryState();
    await store().hydrate();
    expect(store().culture).toEqual(culture);

    const fileText = JSON.stringify(await createBackup());
    await replaceAll({});
    forgetInMemoryState();
    await restoreBackup(fileText);
    await store().hydrate();
    expect(store().culture).toEqual(culture);
  });
});

describe('Korea guide progress', () => {
  it('saves checklist ticks, does not log them as study, and survives a backup', async () => {
    const store = () => useAppStore.getState();
    const today = todayISO();
    await store().hydrate();

    await store().setChecklistItem('check-before-maps', true);
    await store().setChecklistItem('check-before-papago', true);
    await store().setChecklistItem('check-before-papago', false);

    expect(store().koreaGuide).toEqual({ checked: { 'check-before-maps': today } });
    expect(store().activity.days[today]).toBeUndefined();

    const guide = store().koreaGuide;
    forgetInMemoryState();
    await store().hydrate();
    expect(store().koreaGuide).toEqual(guide);

    const fileText = JSON.stringify(await createBackup());
    await replaceAll({});
    forgetInMemoryState();
    await restoreBackup(fileText);
    await store().hydrate();
    expect(store().koreaGuide).toEqual(guide);
  });

  it('drops bad saved ticks', async () => {
    await setValue('koreaGuide', { checked: { a: '2027-02-01', b: 'soon', '': '2027-02-01' } });
    await useAppStore.getState().hydrate();
    expect(useAppStore.getState().koreaGuide).toEqual({ checked: { a: '2027-02-01' } });
    await setValue('koreaGuide', 'junk');
    await useAppStore.getState().hydrate();
    expect(useAppStore.getState().koreaGuide).toEqual(EMPTY_KOREA_GUIDE_PROGRESS);
  });
});
