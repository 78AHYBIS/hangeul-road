import { muted } from '../../components/ui';
import type { Word } from '../../content/vocab';
import type { CardStage } from '../../lib/srs';
import { SpeakButton } from '../hangul/shared';

const STAGE_STYLE: Record<CardStage, string> = {
  new: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
  learning: 'bg-amber-200 text-amber-950 dark:bg-amber-800 dark:text-amber-50',
  review: 'bg-teal-100 text-teal-900 dark:bg-teal-900 dark:text-teal-100',
  mature: 'bg-teal-700 text-white',
};

/** One word in a list. Tap it to open the example sentence and note. */
export function WordRow({ word, stage }: { word: Word; stage: CardStage }) {
  return (
    <li>
      <details className="group py-2.5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <span>
            <span className="block text-xl" lang="ko">
              {word.korean}
            </span>
            <span className={`block ${muted}`}>
              {word.meaning}
              {word.pos && ` · ${word.pos}`}
            </span>
          </span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STAGE_STYLE[stage]}`}>
            {stage}
          </span>
        </summary>
        <div className="mt-2 space-y-2 text-sm">
          {word.example && (
            <p>
              <span className="block text-base" lang="ko">
                {word.example}
              </span>
              <span className={muted}>{word.exampleMeaning}</span>
            </p>
          )}
          {word.note && (
            <p className="rounded-lg bg-stone-100 p-2 dark:bg-stone-800">{word.note}</p>
          )}
          <SpeakButton text={word.example || word.korean} />
        </div>
      </details>
    </li>
  );
}
