import { useEffect } from 'react';
import { useAppStore } from '../lib/storage/store';

/** Adds or removes the `dark` class on <html> to match the theme setting. */
export function useTheme() {
  const theme = useAppStore((s) => s.settings.theme);
  const hydrated = useAppStore((s) => s.hydrated);

  useEffect(() => {
    // Before saved settings load, `theme` is only the default: do not act on it.
    if (!hydrated) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
      // Remembered for the tiny script in index.html, which paints the right
      // background before React and IndexedDB have loaded (no white flash).
      try {
        localStorage.setItem('hangeul-road:dark', dark ? '1' : '0');
      } catch {
        // Storage can be blocked in private mode; the theme still works without it.
      }
    };
    apply();
    // In "system" mode, follow the phone when it switches between light and dark.
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme, hydrated]);
}
