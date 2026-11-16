import { useState } from 'react';
import { Card, Page } from '../../components/Page';
import { muted } from '../../components/ui';
import { FINALS, INITIALS, MEDIALS, compose, romanizeSyllable } from '../../lib/hangul';
import { Romanization, RomanizationToggle, SpeakButton, VoiceNotice } from './shared';

// Vowels drawn as a horizontal line sit under the first consonant; the rest sit to its right.
const UNDER = ['ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ'];
const WRAP = ['ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ'];

export function BuilderPage() {
  const [initial, setInitial] = useState('ㅎ');
  const [medial, setMedial] = useState('ㅏ');
  const [final, setFinal] = useState('ㄴ');
  const block = compose(initial, medial, final);

  const position = UNDER.includes(medial)
    ? `${medial} is a horizontal vowel, so it goes under ${initial}.`
    : WRAP.includes(medial)
      ? `${medial} wraps around ${initial}: one part under it, one part to its right.`
      : `${medial} is a vertical vowel, so it goes to the right of ${initial}.`;

  return (
    <Page
      title="Syllable block builder"
      subtitle="Every block is consonant + vowel, with an optional final consonant."
      back={{ to: '/learn/hangul', label: 'Hangul' }}
    >
      <VoiceNotice />
      <Card>
        <div className="flex items-center justify-between gap-4">
          <p className="text-8xl leading-none" lang="ko" data-testid="block">
            {block}
          </p>
          <div className="space-y-2 text-right">
            <p className="text-xl" lang="ko">
              {initial} + {medial}
              {final && ` + ${final}`}
            </p>
            <p>
              <Romanization text={romanizeSyllable(block)} className="text-lg" />
            </p>
            <SpeakButton text={block} />
          </div>
        </div>
        <p className={`mt-3 ${muted}`}>
          {position}
          {final && ` The final consonant ${final} goes at the bottom.`}
          {initial === 'ㅇ' && ' At the start, ㅇ is silent.'}
        </p>
      </Card>

      <Picker title="1. First consonant" options={INITIALS} value={initial} onChange={setInitial} />
      <Picker title="2. Vowel" options={MEDIALS} value={medial} onChange={setMedial} />
      <Picker
        title="3. Final consonant (optional)"
        options={FINALS}
        value={final}
        onChange={setFinal}
      />
      <Card>
        <RomanizationToggle />
      </Card>
    </Page>
  );
}

function Picker({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Card>
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label={title}>
        {options.map((option) => (
          <button
            key={option || 'none'}
            type="button"
            role="radio"
            aria-checked={option === value}
            onClick={() => onChange(option)}
            lang="ko"
            className={`flex h-11 min-w-11 items-center justify-center rounded-lg px-2 text-xl ${
              option === value ? 'bg-teal-700 text-white' : 'bg-stone-100 dark:bg-stone-800'
            }`}
          >
            {option || <span className="text-sm">none</span>}
          </button>
        ))}
      </div>
    </Card>
  );
}
