import { muted } from '../../components/ui';
import type { Phrase } from '../../content/phrases';
import { useAppStore } from '../../lib/storage/store';
import { SpeakButton } from '../hangul/shared';
import { MixedText } from '../../components/MixedText';

/** Star toggle for the phrasebook. */
export function StarButton({ phraseId }: { phraseId: string }) {
  const starred = useAppStore((s) => s.phrases.starred.includes(phraseId));
  const toggle = useAppStore((s) => s.toggleStarPhrase);
  return (
    <button
      type="button"
      aria-pressed={starred}
      aria-label={starred ? 'Remove from my phrases' : 'Add to my phrases'}
      onClick={() => void toggle(phraseId)}
      className={`flex size-11 shrink-0 items-center justify-center rounded-full text-2xl ${
        starred ? 'text-amber-500' : 'text-stone-400 dark:text-stone-500'
      }`}
    >
      {starred ? '★' : '☆'}
    </button>
  );
}

export function CasualChip() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 align-middle text-xs font-medium text-amber-900 dark:bg-amber-900 dark:text-amber-50">
      Casual
    </span>
  );
}

/** One phrase: Korean, meaning, note, audio and star. */
export function PhraseRow({ phrase, extra }: { phrase: Phrase; extra?: string }) {
  return (
    <li className="flex items-start gap-2 py-3" data-phrase={phrase.id}>
      <div className="min-w-0 flex-1">
        <p className="text-xl" lang="ko">
          {phrase.korean}
          {phrase.casual && <CasualChip />}
        </p>
        <p className={muted}>{phrase.meaning}</p>
        {phrase.note && (
          <p className={`mt-0.5 ${muted} italic`}>
            <MixedText text={phrase.note} />
          </p>
        )}
        {extra && <p className="mt-0.5 text-xs text-stone-400">{extra}</p>}
      </div>
      <SpeakButton text={phrase.korean} label="Play" compact />
      <StarButton phraseId={phrase.id} />
    </li>
  );
}
