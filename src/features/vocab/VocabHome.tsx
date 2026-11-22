import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { btnPrimary, muted } from '../../components/ui';
import { todayISO } from '../../lib/date';
import { LIMITS, buildQueue, stageOf } from '../../lib/srs';
import { useAppStore } from '../../lib/storage/store';
import { VoiceNotice } from '../hangul/shared';
import { allDecks, allWords, countStages, searchWords, studyOrder } from './words';
import { WordRow } from './WordRow';

export function VocabHome() {
  const vocab = useAppStore((s) => s.vocab);
  const goal = useAppStore((s) => s.settings.dailyGoal);
  const [query, setQuery] = useState('');

  const words = allWords(vocab.myWords);
  const queue = buildQueue(vocab.cards, studyOrder(vocab), todayISO(), LIMITS[goal]);
  const todayCount = queue.reviews.length + queue.newCards.length;
  const waiting = queue.dueTotal - queue.reviews.length;
  const stages = countStages(words, vocab.cards);
  const results = searchWords(words, query);

  return (
    <Page
      title="Vocabulary"
      subtitle="A few words every day."
      back={{ to: '/learn', label: 'Learn' }}
    >
      <VoiceNotice />
      <Card tone="accent">
        <p className="text-sm text-teal-100">Today</p>
        {todayCount > 0 ? (
          <p className="mt-1 text-lg" data-testid="today-queue">
            <span className="text-4xl font-bold">{queue.reviews.length}</span> reviews ·{' '}
            <span className="text-4xl font-bold">{queue.newCards.length}</span> new
          </p>
        ) : (
          <p className="mt-1 text-2xl font-bold" data-testid="today-queue">
            All done for today
          </p>
        )}
        {waiting > 0 && (
          <p className="mt-2 text-sm text-teal-100">
            {waiting} more are waiting. They will come in over the next days; there is no need to
            catch up at once.
          </p>
        )}
        {todayCount > 0 && (
          <Link
            to="/learn/vocab/review"
            className="mt-3 flex min-h-12 items-center justify-center rounded-xl bg-white font-medium text-teal-800"
          >
            Start review
          </Link>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold">Your words</h2>
        <dl className="mt-2 grid grid-cols-4 gap-2 text-center" data-testid="stage-counts">
          {(['new', 'learning', 'review', 'mature'] as const).map((stage) => (
            <div key={stage} className="rounded-xl bg-stone-100 py-2 dark:bg-stone-800">
              <dd className="text-xl font-bold tabular-nums">{stages[stage]}</dd>
              <dt className="text-xs text-stone-600 capitalize dark:text-stone-400">{stage}</dt>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <label className="font-semibold" htmlFor="word-search">
          Search all words
        </label>
        <input
          id="word-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Korean or English"
          className="mt-2 w-full rounded-lg border border-stone-300 bg-transparent px-3 py-2.5 dark:border-stone-700"
        />
        {query.trim() !== '' && (
          <ul className="mt-2 divide-y divide-stone-200 dark:divide-stone-800">
            {results.length === 0 && <li className={`py-3 ${muted}`}>No words found.</li>}
            {results.map((word) => (
              <WordRow key={word.id} word={word} stage={stageOf(vocab.cards[word.id])} />
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold">Decks</h2>
        <p className={`mt-1 ${muted}`}>New words arrive in this order.</p>
        <ul className="mt-2 divide-y divide-stone-200 dark:divide-stone-800">
          {allDecks().map((deck, i) => {
            const deckWords = words.filter((w) => w.deck === deck.id);
            const started = deckWords.filter((w) => vocab.cards[w.id]).length;
            return (
              <li key={deck.id}>
                <Link to={`/learn/vocab/deck/${deck.id}`} className="block py-3">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">
                      {i < 15 ? `${i + 1}. ` : ''}
                      {deck.title}
                      {vocab.focusDeck === deck.id && (
                        <span className="ml-2 rounded-full bg-teal-700 px-2 py-0.5 text-xs text-white">
                          next
                        </span>
                      )}
                    </span>
                    <span className={`shrink-0 tabular-nums ${muted}`}>
                      {started} / {deckWords.length}
                    </span>
                  </span>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                    <span
                      className="block h-full bg-teal-700"
                      style={{
                        width: `${deckWords.length ? (started / deckWords.length) * 100 : 0}%`,
                      }}
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/learn/vocab/numbers"
          className={`${btnPrimary} flex items-center justify-center`}
        >
          Number trainer
        </Link>
        <Link
          to="/learn/vocab/my-words"
          className="flex min-h-12 items-center justify-center rounded-xl border border-stone-300 font-medium dark:border-stone-700"
        >
          Add my own words
        </Link>
      </div>
    </Page>
  );
}
