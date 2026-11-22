import { muted } from '../../components/ui';
import { speak } from '../../lib/speech';
import { useAppStore } from '../../lib/storage/store';
import { useKoreanVoice, useKoreanVoices } from '../hangul/useKoreanVoice';

const SAMPLE = '안녕하세요. 저는 한국어를 배우고 있어요.';

/** Lists every Korean voice on the device, with a Test button; the choice is saved. */
export function VoicePicker() {
  const status = useKoreanVoice();
  const voices = useKoreanVoices();
  const chosen = useAppStore((s) => s.settings.voiceURI);
  const rate = useAppStore((s) => s.settings.speechRate);
  const updateSettings = useAppStore((s) => s.updateSettings);
  // A saved voice this device does not have (e.g. after restoring a backup) falls back
  // to the first one, and the list shows that.
  const inUse = voices.some((v) => v.uri === chosen) ? chosen : (voices[0]?.uri ?? '');

  return (
    <section aria-labelledby="voice-title">
      <h2 id="voice-title" className="font-semibold">
        Korean voice
      </h2>
      {status === 'checking' && <p className={`mt-1 ${muted}`}>Looking for Korean voices…</p>}
      {status === 'unavailable' && (
        <p className={`mt-1 ${muted}`}>
          This device has no Korean voice yet, so audio is off. The tips below show how to add one.
        </p>
      )}
      {voices.length > 0 && (
        <>
          <p className={`mt-1 ${muted}`}>
            {voices.length === 1
              ? 'This device has one Korean voice.'
              : `This device has ${voices.length} Korean voices. Test them and pick the clearest.`}
          </p>
          <ul
            role="radiogroup"
            aria-label="Korean voice"
            className="mt-2 divide-y divide-stone-200 dark:divide-stone-800"
          >
            {voices.map((voice) => (
              <li key={voice.uri} className="flex items-center gap-3 py-2">
                <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="korean-voice"
                    className="size-5 shrink-0 accent-teal-700"
                    checked={voice.uri === inUse}
                    onChange={() => void updateSettings({ voiceURI: voice.uri })}
                  />
                  <span className="min-w-0">
                    <span className="block font-medium break-words">{voice.name}</span>
                    {!voice.local && (
                      <span className={`block ${muted}`}>Online voice: needs internet</span>
                    )}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => speak(SAMPLE, rate, voice.uri)}
                  aria-label={`Test ${voice.name}`}
                  className="min-h-10 shrink-0 rounded-full border border-stone-300 px-4 text-sm font-medium dark:border-stone-700"
                >
                  Test
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <details className="mt-2">
        <summary className="flex min-h-10 cursor-pointer items-center text-sm font-medium text-teal-700 dark:text-teal-400">
          How to get a better Korean voice
        </summary>
        <div className={`space-y-2 ${muted}`}>
          <p>
            The app speaks with your phone&apos;s own voices. Better ones are free to download, then
            come back here and pick them.
          </p>
          <p>
            <strong className="text-stone-700 dark:text-stone-200">iPhone:</strong> Settings →
            Accessibility → Spoken Content → Voices → Korean. Download a voice marked Enhanced or
            Premium.
          </p>
          <p>
            <strong className="text-stone-700 dark:text-stone-200">Android:</strong> Settings →
            Text-to-speech output (often under Accessibility) → Preferred engine: Speech Services by
            Google → its settings → Install voice data → Korean. Pick a voice and download it.
          </p>
          <p>
            Then close and reopen the app, so the browser lists the new voice. Voices marked
            &quot;needs internet&quot; do not work in airplane mode.
          </p>
        </div>
      </details>
    </section>
  );
}
