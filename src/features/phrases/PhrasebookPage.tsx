import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { btnPrimary, btnSecondary, inputClass, muted } from '../../components/ui';
import { PHRASE_PACKS } from '../../content/phrases';
import { buildIntro } from '../../lib/selfIntro';
import { useAppStore } from '../../lib/storage/store';
import { SpeakButton, VoiceNotice } from '../hangul/shared';
import { filterPhrases, type Filter } from './phrasebook';
import { CasualChip, StarButton } from './PhraseRow';

/** A card shown full-screen: one phrase, or the self-introduction. */
interface ShowCard {
  key: string;
  korean: string;
  meaning: string;
  casual?: boolean;
}

export function PhrasebookPage() {
  const starred = useAppStore((s) => s.phrases.starred);
  const intro = useAppStore((s) => s.phrases.intro);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [packId, setPackId] = useState('');
  const [shown, setShown] = useState<{ cards: ShowCard[]; index: number } | null>(null);

  const phrases = filterPhrases(query, filter, packId, starred);
  const cards: ShowCard[] = phrases.map((p) => ({
    key: p.id,
    korean: p.korean,
    meaning: p.meaning,
    casual: p.casual,
  }));
  const introLines = intro.name ? buildIntro(intro, 'polite') : [];

  return (
    <Page
      title="Phrasebook"
      subtitle="Tap a phrase to show it in large text. Works without internet."
      back={{ to: '/learn/phrases', label: 'Phrases' }}
    >
      <VoiceNotice />

      {introLines.length > 0 ? (
        <button
          type="button"
          className="block w-full text-left"
          onClick={() =>
            setShown({
              cards: [
                {
                  key: 'intro',
                  korean: introLines.map((l) => l.korean).join(' '),
                  meaning: 'My self-introduction',
                },
              ],
              index: 0,
            })
          }
        >
          <Card tone="accent">
            <p className="text-sm text-teal-100">My introduction</p>
            <p className="mt-1 text-lg" lang="ko">
              {introLines[1]?.korean ?? introLines[0]!.korean}
            </p>
          </Card>
        </button>
      ) : (
        <p className={muted}>
          Tip: build your{' '}
          <Link
            to="/learn/phrases/intro"
            className="text-teal-700 underline underline-offset-2 dark:text-teal-400"
          >
            self-introduction
          </Link>{' '}
          and it will appear here.
        </p>
      )}

      <div className="space-y-3">
        <label className="block text-sm font-medium">
          Search
          <input
            type="search"
            className={inputClass}
            value={query}
            placeholder="English or Korean, e.g. water"
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="flex gap-3">
          <div
            role="radiogroup"
            aria-label="Show"
            className="flex flex-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-800"
          >
            {(['all', 'starred'] as const).map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={filter === f}
                onClick={() => setFilter(f)}
                className={`min-h-10 flex-1 rounded-lg text-sm font-medium ${
                  filter === f
                    ? 'bg-white text-teal-700 shadow-sm dark:bg-stone-950 dark:text-teal-400'
                    : 'text-stone-600 dark:text-stone-300'
                }`}
              >
                {f === 'all' ? 'All' : `★ Starred (${starred.length})`}
              </button>
            ))}
          </div>
          <label className="flex-1">
            <span className="sr-only">Situation</span>
            <select
              className="min-h-12 w-full rounded-xl border border-stone-300 bg-transparent px-2 text-sm dark:border-stone-700"
              value={packId}
              onChange={(e) => setPackId(e.target.value)}
            >
              <option value="">All situations</option>
              {PHRASE_PACKS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p className={muted} data-testid="phrase-count">
        {phrases.length} {phrases.length === 1 ? 'phrase' : 'phrases'}
      </p>
      {phrases.length === 0 && filter === 'starred' && (
        <p className={muted}>No starred phrases yet. Tap ☆ next to a phrase to add it here.</p>
      )}
      <ul className="space-y-3" data-testid="phrasebook">
        {phrases.map((phrase, i) => (
          <li key={phrase.id}>
            <Card>
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  className="min-h-11 min-w-0 flex-1 text-left"
                  onClick={() => setShown({ cards, index: i })}
                >
                  <span className="sr-only">Show large: </span>
                  <span className="block text-2xl" lang="ko">
                    {phrase.korean}
                    {phrase.casual && <CasualChip />}
                  </span>
                  <span className={`block ${muted}`}>{phrase.meaning}</span>
                  <span className="block text-xs text-stone-500 dark:text-stone-400">
                    {phrase.packTitle}
                  </span>
                </button>
                <SpeakButton text={phrase.korean} label="Play" compact />
                <StarButton phraseId={phrase.id} />
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {shown && (
        <ShowMode
          cards={shown.cards}
          index={shown.index}
          onMove={(index) => setShown({ ...shown, index })}
          onClose={() => setShown(null)}
        />
      )}
    </Page>
  );
}

/** Full-screen, large text: for reading out or turning the phone towards someone. */
function ShowMode({
  cards,
  index,
  onMove,
  onClose,
}: {
  cards: ShowCard[];
  index: number;
  onMove: (index: number) => void;
  onClose: () => void;
}) {
  const card = cards[index]!;

  // Escape closes the card on a desktop keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Phrase card"
      className="fixed inset-0 z-50 flex flex-col bg-white px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] dark:bg-stone-950"
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto text-center">
        <p
          className={`leading-snug font-semibold break-keep ${
            card.korean.length > 40 ? 'text-3xl' : 'text-5xl'
          }`}
          lang="ko"
          data-testid="show-korean"
        >
          {card.korean}
        </p>
        <p className="text-lg text-stone-500 dark:text-stone-400">
          {card.meaning}
          {card.casual && <CasualChip />}
        </p>
        <SpeakButton text={card.korean} label="Play" />
      </div>
      <div className="mx-auto grid w-full max-w-xl gap-3">
        {cards.length > 1 && (
          <div className="flex gap-3">
            <button
              type="button"
              className={`${btnSecondary} flex-1`}
              disabled={index === 0}
              onClick={() => onMove(index - 1)}
            >
              ‹ Previous
            </button>
            <button
              type="button"
              className={`${btnSecondary} flex-1`}
              disabled={index === cards.length - 1}
              onClick={() => onMove(index + 1)}
            >
              Next ›
            </button>
          </div>
        )}
        <button type="button" className={`${btnPrimary} w-full`} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
