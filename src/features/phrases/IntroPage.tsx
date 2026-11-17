import { useState } from 'react';
import { Card, Page } from '../../components/Page';
import { btnPrimary, chip, inputClass, muted } from '../../components/ui';
import {
  COUNTRIES,
  HOBBIES,
  MAJORS,
  MAX_HOBBIES,
  buildIntro,
  needsHangul,
  type Choice,
  type IntroDetails,
  type IntroStyle,
} from '../../lib/selfIntro';
import { speak } from '../../lib/speech';
import { useAppStore } from '../../lib/storage/store';
import { SpeakButton, VoiceNotice } from '../hangul/shared';
import { useKoreanVoice } from '../hangul/useKoreanVoice';

const OTHER = '__other';
const selectClass =
  'mt-1 min-h-12 w-full rounded-lg border border-stone-300 bg-transparent px-2 dark:border-stone-700';

export function IntroPage() {
  const intro = useAppStore((s) => s.phrases.intro);
  const setIntro = useAppStore((s) => s.setIntro);
  const rate = useAppStore((s) => s.settings.speechRate);
  const voice = useKoreanVoice();
  const [style, setStyle] = useState<IntroStyle>('polite');

  const update = (patch: Partial<IntroDetails>) => void setIntro({ ...intro, ...patch });
  const lines = buildIntro(intro, style);
  const latin = [intro.name, intro.country, intro.major].some(needsHangul);

  function toggleHobby(korean: string) {
    const has = intro.hobbies.includes(korean);
    if (!has && intro.hobbies.length >= MAX_HOBBIES) return;
    update({
      hobbies: has ? intro.hobbies.filter((h) => h !== korean) : [...intro.hobbies, korean],
    });
  }

  return (
    <Page
      title="My self-introduction"
      subtitle="Fill in your details. The Korean updates as you type."
      back={{ to: '/learn/phrases', label: 'Phrases' }}
    >
      <VoiceNotice />
      <Card>
        <div className="space-y-4">
          <label className="block text-sm font-medium">
            Your name, in Hangul
            <input
              className={inputClass}
              lang="ko"
              value={intro.name}
              placeholder="e.g. 아이다르"
              onChange={(e) => update({ name: e.target.value })}
            />
            <span className={`mt-1 block font-normal ${muted}`}>
              Write it the way it sounds. A Korean friend can check the spelling for you.
            </span>
          </label>

          <ChoiceField
            label="Country"
            list={COUNTRIES}
            value={intro.country}
            onChange={(country) => update({ country })}
          />

          <label className="block text-sm font-medium">
            University
            <input
              className={inputClass}
              value={intro.university}
              onChange={(e) => update({ university: e.target.value })}
            />
          </label>
          <label className="flex min-h-11 items-center justify-between gap-4 text-sm font-medium">
            I am an exchange student there
            <input
              type="checkbox"
              role="switch"
              className="size-6 accent-teal-700"
              checked={intro.exchange}
              onChange={(e) => update({ exchange: e.target.checked })}
            />
          </label>

          <ChoiceField
            label="Major"
            list={MAJORS}
            value={intro.major}
            onChange={(major) => update({ major })}
          />

          <fieldset>
            <legend className="text-sm font-medium">Hobbies (up to {MAX_HOBBIES})</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {HOBBIES.map((h) => {
                const on = intro.hobbies.includes(h.korean);
                return (
                  <button
                    key={h.korean}
                    type="button"
                    aria-pressed={on}
                    disabled={!on && intro.hobbies.length >= MAX_HOBBIES}
                    onClick={() => toggleHobby(h.korean)}
                    className={`min-h-10 rounded-full border px-3 text-sm disabled:opacity-40 ${
                      on
                        ? 'border-teal-700 bg-teal-700 text-white'
                        : 'border-stone-300 dark:border-stone-700'
                    }`}
                  >
                    <span lang="ko">{h.korean}</span> · {h.english}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Your introduction</h2>
          <div
            role="radiogroup"
            aria-label="Style"
            className="flex rounded-xl bg-stone-100 p-1 dark:bg-stone-800"
          >
            {(['polite', 'formal'] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={style === s}
                onClick={() => setStyle(s)}
                className={`min-h-10 rounded-lg px-3 text-sm font-medium ${
                  style === s
                    ? 'bg-white text-teal-700 shadow-sm dark:bg-stone-950 dark:text-teal-400'
                    : 'text-stone-600 dark:text-stone-300'
                }`}
              >
                {s === 'polite' ? '해요 polite' : '합니다 formal'}
              </button>
            ))}
          </div>
        </div>
        <p className={`mt-2 ${muted}`}>
          {style === 'polite'
            ? 'For classmates, dorm neighbours and everyday meetings.'
            : 'For professors, a class introduction or an interview.'}
        </p>
        {latin && (
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200" role="status">
            Some details are not in Hangul, so their lines use 입니다, which fits any word. Write
            them in Hangul to get the 해요 form.
          </p>
        )}
        <ol className="mt-2 divide-y divide-stone-200 dark:divide-stone-800" data-testid="intro">
          {lines.map((line) => (
            <li key={line.korean} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-xl" lang="ko">
                  {line.korean}
                </p>
                <p className={muted}>{line.meaning}</p>
              </div>
              <SpeakButton text={line.korean} label="Play" compact />
            </li>
          ))}
        </ol>
        <button
          type="button"
          className={`${btnPrimary} mt-3 w-full`}
          disabled={voice !== 'available'}
          onClick={() => speak(lines.map((l) => l.korean).join(' '), rate)}
        >
          Listen to all of it
        </button>
        <p className={`mt-2 ${muted}`}>
          Saved automatically. It also appears at the top of your phrasebook.
        </p>
      </Card>
      <p className={muted}>
        <span className={chip}>Tip</span> Read it aloud along with the audio until you can say it
        without looking.
      </p>
    </Page>
  );
}

/** A list to pick from, with "Other" for typing your own (in Hangul). */
function ChoiceField({
  label,
  list,
  value,
  onChange,
}: {
  label: string;
  list: Choice[];
  value: string;
  onChange: (value: string) => void;
}) {
  const inList = list.some((c) => c.korean === value);
  const [other, setOther] = useState(value !== '' && !inList);
  const selected = other ? OTHER : inList ? value : '';

  return (
    <div>
      <label className="block text-sm font-medium">
        {label}
        <select
          className={selectClass}
          value={selected}
          onChange={(e) => {
            const v = e.target.value;
            setOther(v === OTHER);
            onChange(v === OTHER ? '' : v);
          }}
        >
          <option value="">Choose…</option>
          {list.map((c) => (
            <option key={c.korean} value={c.korean}>
              {c.korean} · {c.english}
            </option>
          ))}
          <option value={OTHER}>Other (type it in Hangul)</option>
        </select>
      </label>
      {other && (
        <label className="mt-2 block text-sm font-medium">
          {label} in Hangul
          <input
            className={inputClass}
            lang="ko"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      )}
    </div>
  );
}
