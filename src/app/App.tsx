import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RoadmapPage } from '../features/daily/RoadmapPage';
import { TodayPage } from '../features/daily/TodayPage';
import { BuilderPage } from '../features/hangul/BuilderPage';
import { DrillPage } from '../features/hangul/DrillPage';
import { HangulHome } from '../features/hangul/HangulHome';
import { LessonPage } from '../features/hangul/LessonPage';
import { ReadingPage } from '../features/hangul/ReadingPage';
import { RulePage } from '../features/hangul/RulePage';
import { TimedPage } from '../features/hangul/TimedPage';
import { TypingPage } from '../features/hangul/TypingPage';
import { GrammarHome } from '../features/grammar/GrammarHome';
import { GrammarLessonPage } from '../features/grammar/GrammarLessonPage';
import { GrammarPracticePage } from '../features/grammar/GrammarPracticePage';
import { CardPage } from '../features/culture/CardPage';
import { TopicPage } from '../features/culture/TopicPage';
import { TopicQuizPage } from '../features/culture/TopicQuizPage';
import { AppPage } from '../features/korea-guide/AppPage';
import { AppsPage } from '../features/korea-guide/AppsPage';
import { AppWordsPage } from '../features/korea-guide/AppWordsPage';
import { ChecklistsPage } from '../features/korea-guide/ChecklistsPage';
import { HowToListPage, HowToPage } from '../features/korea-guide/HowToPages';
import { KoreaPage } from '../features/korea-guide/KoreaPage';
import { LearnPage } from '../features/learn/LearnPage';
import { AddResourcePage } from '../features/library/AddResourcePage';
import { LibraryPage } from '../features/library/LibraryPage';
import { ResourcePage } from '../features/library/ResourcePage';
import { IntroPage } from '../features/phrases/IntroPage';
import { PackPage } from '../features/phrases/PackPage';
import { PackQuizPage } from '../features/phrases/PackQuizPage';
import { PhrasebookPage } from '../features/phrases/PhrasebookPage';
import { PhrasesHome } from '../features/phrases/PhrasesHome';
import { MePage } from '../features/settings/MePage';
import { ProgressPage } from '../features/settings/ProgressPage';
import { WeeklyPage } from '../features/settings/WeeklyPage';
import { DeckPage } from '../features/vocab/DeckPage';
import { MyWordsPage } from '../features/vocab/MyWordsPage';
import { NumbersPage } from '../features/vocab/NumbersPage';
import { ReviewPage } from '../features/vocab/ReviewPage';
import { VocabHome } from '../features/vocab/VocabHome';
import { useAppStore } from '../lib/storage/store';
import { Layout } from './Layout';
import { useTheme } from './useTheme';

export function App() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  useTheme();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Wait for saved settings so the UI never flashes default values.
  if (!hydrated) return null;

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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
