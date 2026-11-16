import { useEffect, useState } from 'react';
import { Card, Page } from '../../components/Page';
import { btnPrimary, btnSecondary, muted } from '../../components/ui';
import { READING_WORDS } from '../../content/hangul';
import {
  KEYBOARD_ROWS,
  SHIFT_JAMO,
  TYPEABLE_JAMO,
  jamoForKey,
  toKeystrokes,
  typedSoFar,
} from '../../lib/hangul';
import { useAppStore } from '../../lib/storage/store';
import { shuffle } from './drills';

const BACK = { to: '/learn/hangul', label: 'Hangul' };
type Mode = 'letters' | 'words';

export function TypingPage() {
  const recordLetters = useAppStore((s) => s.recordLetters);
  const [targets, setTargets] = useState<string[] | null>(null);
  const [targetIndex, setTargetIndex] = useState(0);
  const [typed, setTyped] = useState(0); // key presses done in the current target
  const [slipped, setSlipped] = useState(false); // a wrong key was pressed for the current key
  const [shift, setShift] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  const target = targets?.[targetIndex];
  const chars = target ? toKeystrokes(target) : [];
  const keys = chars.flatMap((c) => c.keys);
  const expected = keys[typed];

  function start(mode: Mode) {
    const source =
      mode === 'letters'
        ? TYPEABLE_JAMO
        : READING_WORDS.filter((w) => !w.korean.includes(' ')).map((w) => w.korean);
    setTargets(shuffle(source, Math.random).slice(0, mode === 'letters' ? 12 : 8));
    setTargetIndex(0);
    setTyped(0);
    setSlipped(false);
    setShift(false);
    setMistakes(0);
  }

  function press(jamo: string) {
    if (!expected) return;
    if (jamo !== expected) {
      if (!slipped) {
        setMistakes(mistakes + 1);
        void recordLetters([expected], false);
      }
      setSlipped(true);
      return;
    }
    if (!slipped) void recordLetters([expected], true);
    setSlipped(false);
    setShift(false);
    if (typed + 1 < keys.length) {
      setTyped(typed + 1);
    } else {
      setTargetIndex(targetIndex + 1);
      setTyped(0);
    }
  }

  // A physical keyboard works too. `code` is the key's position, so this works
  // whether the computer is set to English or Korean input.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const jamo = jamoForKey(event.code, event.shiftKey);
      if (jamo) {
        event.preventDefault();
        press(jamo);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!targets) {
    return (
      <Page title="Typing" subtitle="The standard Korean two-set (dubeolsik) layout." back={BACK}>
        <Card>
          <p className="leading-relaxed">
            Consonants are on the left hand, vowels on the right. Shift gives the double consonants
            and ㅒ, ㅖ. Tap the keys on screen, or use a physical keyboard.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className={`${btnPrimary} flex-1`}
              onClick={() => start('letters')}
            >
              Letters
            </button>
            <button
              type="button"
              className={`${btnSecondary} flex-1`}
              onClick={() => start('words')}
            >
              Words
            </button>
          </div>
        </Card>
        <Keyboard shift={false} onPress={() => {}} onShift={() => {}} />
      </Page>
    );
  }

  if (!target) {
    return (
      <Page title="Typing" back={BACK}>
        <Card>
          <p className={muted}>Finished</p>
          <p className="mt-1 text-3xl font-bold" data-testid="typing-result">
            {mistakes === 0 ? 'No mistakes' : `${mistakes} ${mistakes === 1 ? 'slip' : 'slips'}`}
          </p>
          <button
            type="button"
            className={`${btnPrimary} mt-4 w-full`}
            onClick={() => setTargets(null)}
          >
            Choose again
          </button>
        </Card>
      </Page>
    );
  }

  const typedText = typedSoFar(chars, typed);

  return (
    <Page title="Typing" subtitle={`${targetIndex + 1} of ${targets.length}`} back={BACK}>
      <Card>
        <p className="text-center text-5xl" lang="ko" data-testid="typing-target">
          {target}
        </p>
        <p
          className="mt-3 min-h-12 text-center text-4xl text-teal-700 dark:text-teal-400"
          lang="ko"
          data-testid="typing-typed"
        >
          {typedText}
        </p>
        <p className={`text-center ${muted}`} role="status">
          {slipped ? `Not that one. The next key is ${expected}.` : 'Type the word above.'}
        </p>
      </Card>
      <Keyboard
        shift={shift}
        hint={slipped ? expected : undefined}
        onPress={press}
        onShift={() => setShift(!shift)}
      />
    </Page>
  );
}

function Keyboard({
  shift,
  hint,
  onPress,
  onShift,
}: {
  shift: boolean;
  hint?: string;
  onPress: (jamo: string) => void;
  onShift: () => void;
}) {
  return (
    <div className="space-y-1.5" aria-label="Korean keyboard">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1">
          {rowIndex === 2 && (
            <button
              type="button"
              aria-pressed={shift}
              onClick={onShift}
              className={`h-12 flex-[1.5] rounded-lg text-xs font-medium ${
                shift || (hint && SHIFT_JAMO.has(hint))
                  ? 'bg-teal-700 text-white'
                  : 'bg-stone-200 dark:bg-stone-800'
              }`}
            >
              Shift
            </button>
          )}
          {row.map((def) => {
            const jamo = shift && def.shift ? def.shift : def.jamo;
            const isHint = hint === jamo;
            return (
              <button
                key={def.code}
                type="button"
                onClick={() => onPress(jamo)}
                className={`relative h-12 max-w-11 flex-1 rounded-lg text-xl ${
                  isHint ? 'bg-amber-300 text-amber-950' : 'bg-white shadow-sm dark:bg-stone-800'
                }`}
              >
                <span lang="ko">{jamo}</span>
                <span className="absolute top-0.5 left-1 text-[9px] text-stone-400 uppercase">
                  {def.latin}
                </span>
              </button>
            );
          })}
          {rowIndex === 2 && <span className="flex-[1.5]" />}
        </div>
      ))}
    </div>
  );
}
