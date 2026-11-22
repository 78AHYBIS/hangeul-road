import { useEffect } from 'react';
import { setPreferredVoice } from '../lib/speech';
import { TEXT_SIZE_PERCENT } from '../lib/storage/schema';
import { useAppStore } from '../lib/storage/store';

/** Applies settings that live outside React: text size and the chosen Korean voice. */
export function useSettingsEffects() {
  const textSize = useAppStore((s) => s.settings.textSize);
  const voiceURI = useAppStore((s) => s.settings.voiceURI);
  const hydrated = useAppStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    const percent = TEXT_SIZE_PERCENT[textSize];
    // Tailwind sizes are in rem, so the root font size scales the whole app.
    document.documentElement.style.fontSize = percent === 100 ? '' : `${percent}%`;
    try {
      // For the inline script in index.html, so the first paint has the right size.
      if (percent === 100) localStorage.removeItem('hangeul-road:text-size');
      else localStorage.setItem('hangeul-road:text-size', String(percent));
    } catch {
      // Storage can be blocked; the size still applies once the app has loaded.
    }
  }, [textSize, hydrated]);

  useEffect(() => {
    setPreferredVoice(voiceURI);
  }, [voiceURI]);
}
