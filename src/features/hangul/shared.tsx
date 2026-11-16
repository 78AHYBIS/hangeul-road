import { speak } from '../../lib/speech';
import { useAppStore } from '../../lib/storage/store';
import { useKoreanVoice } from './useKoreanVoice';

/** Plays Korean audio. Disabled, with a clear label, when the device has no Korean voice. */
export function SpeakButton({ text, label = 'Listen' }: { text: string; label?: string }) {
  const status = useKoreanVoice();
  const rate = useAppStore((s) => s.settings.speechRate);
  return (
    <button
      type="button"
      disabled={status !== 'available'}
      onClick={() => speak(text, rate)}
      aria-label={`${label}: ${text}`}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone-300 px-4 text-sm font-medium disabled:opacity-50 dark:border-stone-700"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 9v6h4l5 4V5L8 9H4ZM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
      </svg>
      {status === 'unavailable' ? 'No audio' : label}
    </button>
  );
}

/** Explains missing audio instead of failing silently. Renders nothing when audio works. */
export function VoiceNotice() {
  const status = useKoreanVoice();
  if (status !== 'unavailable') return null;
  return (
    <div
      role="status"
      className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
    >
      <p className="font-semibold">No Korean voice on this device</p>
      <p className="mt-1">
        Audio is switched off, and everything else still works. To get audio, add a Korean voice in
        your device&apos;s text-to-speech settings, or open the app in another browser.
      </p>
    </div>
  );
}

/** Romanized text that disappears when "Show romanization" is off. */
export function Romanization({ text, className = '' }: { text: string; className?: string }) {
  const show = useAppStore((s) => s.settings.showRomanization);
  if (!show || !text) return null;
  return (
    <span className={`text-stone-500 dark:text-stone-400 ${className}`} data-romanization>
      {text}
    </span>
  );
}

export function RomanizationToggle() {
  const show = useAppStore((s) => s.settings.showRomanization);
  const updateSettings = useAppStore((s) => s.updateSettings);
  return (
    <label className="flex min-h-11 items-center justify-between gap-4 text-sm font-medium">
      Show romanization
      <input
        type="checkbox"
        role="switch"
        className="size-6 accent-teal-700"
        checked={show}
        onChange={(e) => void updateSettings({ showRomanization: e.target.checked })}
      />
    </label>
  );
}
