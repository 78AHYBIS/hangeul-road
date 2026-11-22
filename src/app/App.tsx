import { Suspense, lazy, useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAppStore } from '../lib/storage/store';
import { Layout } from './Layout';
import { useReminders } from './reminders';
import { useSettingsEffects } from './useSettingsEffects';
import { useTheme } from './useTheme';

// Each page is loaded when first opened, so the first screen loads fast. The service
// worker caches every chunk, so pages still open offline. Pages export named components,
// hence the `.then` that turns them into the default export React.lazy expects.
const RoadmapPage = lazy(() =>
  import('../features/daily/RoadmapPage').then((m) => ({ default: m.RoadmapPage })),
);
const TodayPage = lazy(() =>
  import('../features/daily/TodayPage').then((m) => ({ default: m.TodayPage })),
);
const BuilderPage = lazy(() =>
  import('../features/hangul/BuilderPage').then((m) => ({ default: m.BuilderPage })),
);
const DrillPage = lazy(() =>
  import('../features/hangul/DrillPage').then((m) => ({ default: m.DrillPage })),
);
const HangulHome = lazy(() =>
  import('../features/hangul/HangulHome').then((m) => ({ default: m.HangulHome })),
);
const LessonPage = lazy(() =>
  import('../features/hangul/LessonPage').then((m) => ({ default: m.LessonPage })),
);
const ReadingPage = lazy(() =>
  import('../features/hangul/ReadingPage').then((m) => ({ default: m.ReadingPage })),
);
const RulePage = lazy(() =>
  import('../features/hangul/RulePage').then((m) => ({ default: m.RulePage })),
);
const TimedPage = lazy(() =>
  import('../features/hangul/TimedPage').then((m) => ({ default: m.TimedPage })),
);
const TypingPage = lazy(() =>
  import('../features/hangul/TypingPage').then((m) => ({ default: m.TypingPage })),
);
const GrammarHome = lazy(() =>
  import('../features/grammar/GrammarHome').then((m) => ({ default: m.GrammarHome })),
);
const GrammarLessonPage = lazy(() =>
  import('../features/grammar/GrammarLessonPage').then((m) => ({ default: m.GrammarLessonPage })),
);
const GrammarPracticePage = lazy(() =>
  import('../features/grammar/GrammarPracticePage').then((m) => ({
    default: m.GrammarPracticePage,
  })),
);
const CardPage = lazy(() =>
  import('../features/culture/CardPage').then((m) => ({ default: m.CardPage })),
);
const TopicPage = lazy(() =>
  import('../features/culture/TopicPage').then((m) => ({ default: m.TopicPage })),
);
const TopicQuizPage = lazy(() =>
  import('../features/culture/TopicQuizPage').then((m) => ({ default: m.TopicQuizPage })),
);
const AppPage = lazy(() =>
  import('../features/korea-guide/AppPage').then((m) => ({ default: m.AppPage })),
);
const AppsPage = lazy(() =>
  import('../features/korea-guide/AppsPage').then((m) => ({ default: m.AppsPage })),
);
const AppWordsPage = lazy(() =>
  import('../features/korea-guide/AppWordsPage').then((m) => ({ default: m.AppWordsPage })),
);
const ChecklistsPage = lazy(() =>
  import('../features/korea-guide/ChecklistsPage').then((m) => ({ default: m.ChecklistsPage })),
);
const HowToListPage = lazy(() =>
  import('../features/korea-guide/HowToPages').then((m) => ({ default: m.HowToListPage })),
);
const HowToPage = lazy(() =>
  import('../features/korea-guide/HowToPages').then((m) => ({ default: m.HowToPage })),
);
const KoreaPage = lazy(() =>
  import('../features/korea-guide/KoreaPage').then((m) => ({ default: m.KoreaPage })),
);
const LearnPage = lazy(() =>
  import('../features/learn/LearnPage').then((m) => ({ default: m.LearnPage })),
);
const AddResourcePage = lazy(() =>
  import('../features/library/AddResourcePage').then((m) => ({ default: m.AddResourcePage })),
);
const LibraryPage = lazy(() =>
  import('../features/library/LibraryPage').then((m) => ({ default: m.LibraryPage })),
);
const ResourcePage = lazy(() =>
  import('../features/library/ResourcePage').then((m) => ({ default: m.ResourcePage })),
);
const IntroPage = lazy(() =>
  import('../features/phrases/IntroPage').then((m) => ({ default: m.IntroPage })),
);
const PackPage = lazy(() =>
  import('../features/phrases/PackPage').then((m) => ({ default: m.PackPage })),
);
const PackQuizPage = lazy(() =>
  import('../features/phrases/PackQuizPage').then((m) => ({ default: m.PackQuizPage })),
);
const PhrasebookPage = lazy(() =>
  import('../features/phrases/PhrasebookPage').then((m) => ({ default: m.PhrasebookPage })),
);
const PhrasesHome = lazy(() =>
  import('../features/phrases/PhrasesHome').then((m) => ({ default: m.PhrasesHome })),
);
const MePage = lazy(() =>
  import('../features/settings/MePage').then((m) => ({ default: m.MePage })),
);
const ProgressPage = lazy(() =>
  import('../features/settings/ProgressPage').then((m) => ({ default: m.ProgressPage })),
);
const WeeklyPage = lazy(() =>
  import('../features/settings/WeeklyPage').then((m) => ({ default: m.WeeklyPage })),
);
const DeckPage = lazy(() =>
  import('../features/vocab/DeckPage').then((m) => ({ default: m.DeckPage })),
);
const MyWordsPage = lazy(() =>
  import('../features/vocab/MyWordsPage').then((m) => ({ default: m.MyWordsPage })),
);
const NumbersPage = lazy(() =>
  import('../features/vocab/NumbersPage').then((m) => ({ default: m.NumbersPage })),
);
const ReviewPage = lazy(() =>
  import('../features/vocab/ReviewPage').then((m) => ({ default: m.ReviewPage })),
);
const VocabHome = lazy(() =>
  import('../features/vocab/VocabHome').then((m) => ({ default: m.VocabHome })),
);
const OnboardingPage = lazy(() =>
  import('../features/onboarding/OnboardingPage').then((m) => ({ default: m.OnboardingPage })),
);
const SearchPage = lazy(() =>
  import('../features/search/SearchPage').then((m) => ({ default: m.SearchPage })),
);

export function App() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const onboarded = useAppStore((s) => s.settings.onboarded);
  useTheme();
  useSettingsEffects();
  useReminders();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Wait for saved settings so the UI never flashes default values.
  if (!hydrated) return null;

  if (!onboarded) {
    return (
      <Suspense fallback={null}>
        <OnboardingPage />
      </Suspense>
    );
  }

  // HashRouter (/#/learn) because GitHub Pages cannot serve deep links of a single-page app.
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<TodayPage />} />
          <Route path="learn" element={<LearnPage />} />
          <Route path="learn/hangul" element={<HangulHome />} />
          <Route path="learn/hangul/lesson/:id" element={<LessonPage />} />
          <Route path="learn/hangul/rule/:id" element={<RulePage />} />
          <Route path="learn/hangul/builder" element={<BuilderPage />} />
          <Route path="learn/hangul/reading" element={<ReadingPage />} />
          <Route path="learn/hangul/drill/:type" element={<DrillPage />} />
          <Route path="learn/hangul/timed" element={<TimedPage />} />
          <Route path="learn/hangul/typing" element={<TypingPage />} />
          <Route path="learn/vocab" element={<VocabHome />} />
          <Route path="learn/vocab/review" element={<ReviewPage />} />
          <Route path="learn/vocab/deck/:id" element={<DeckPage />} />
          <Route path="learn/vocab/my-words" element={<MyWordsPage />} />
          <Route path="learn/vocab/numbers" element={<NumbersPage />} />
          <Route path="learn/grammar" element={<GrammarHome />} />
          <Route path="learn/grammar/:id" element={<GrammarLessonPage />} />
          <Route path="learn/grammar/:id/practice" element={<GrammarPracticePage />} />
          <Route path="learn/phrases" element={<PhrasesHome />} />
          <Route path="learn/phrases/book" element={<PhrasebookPage />} />
          <Route path="learn/phrases/intro" element={<IntroPage />} />
          <Route path="learn/phrases/:id" element={<PackPage />} />
          <Route path="learn/phrases/:id/quiz" element={<PackQuizPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="library/add" element={<AddResourcePage />} />
          <Route path="library/:id" element={<ResourcePage />} />
          <Route path="korea" element={<KoreaPage />} />
          <Route path="korea/topic/:id" element={<TopicPage />} />
          <Route path="korea/topic/:id/quiz" element={<TopicQuizPage />} />
          <Route path="korea/card/:id" element={<CardPage />} />
          <Route path="korea/apps" element={<AppsPage />} />
          <Route path="korea/apps/:id" element={<AppPage />} />
          <Route path="korea/checklists" element={<ChecklistsPage />} />
          <Route path="korea/howto" element={<HowToListPage />} />
          <Route path="korea/howto/:id" element={<HowToPage />} />
          <Route path="korea/app-words" element={<AppWordsPage />} />
          <Route path="roadmap" element={<RoadmapPage />} />
          <Route path="me" element={<MePage />} />
          <Route path="me/progress" element={<ProgressPage />} />
          <Route path="me/week" element={<WeeklyPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
