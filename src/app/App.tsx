import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { TodayPage } from '../features/daily/TodayPage';
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
          <Route path="library" element={<LibraryPage />} />
          <Route path="korea" element={<KoreaPage />} />
          <Route path="me" element={<MePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
