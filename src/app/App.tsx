import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { TodayPage } from '../features/daily/TodayPage';
import { BuilderPage } from '../features/hangul/BuilderPage';
import { DrillPage } from '../features/hangul/DrillPage';
import { HangulHome } from '../features/hangul/HangulHome';
import { LessonPage } from '../features/hangul/LessonPage';
import { ReadingPage } from '../features/hangul/ReadingPage';
import { RulePage } from '../features/hangul/RulePage';
import { TimedPage } from '../features/hangul/TimedPage';
import { TypingPage } from '../features/hangul/TypingPage';
import { KoreaPage } from '../features/korea-guide/KoreaPage';
import { LearnPage } from '../features/learn/LearnPage';
import { LibraryPage } from '../features/library/LibraryPage';
import { MePage } from '../features/settings/MePage';
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
          <Route path="library" element={<LibraryPage />} />
          <Route path="korea" element={<KoreaPage />} />
          <Route path="me" element={<MePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
