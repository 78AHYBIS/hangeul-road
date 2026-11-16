import { Navigate, useParams } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { btnPrimary, btnSecondary, muted } from '../../components/ui';
import { stageOf } from '../../lib/srs';
import { useAppStore } from '../../lib/storage/store';
import { VoiceNotice } from '../hangul/shared';
import { allDecks, allWords } from './words';
import { WordRow } from './WordRow';

export function DeckPage() {
  const { id } = useParams();
  const vocab = useAppStore((s) => s.vocab);
  const setFocusDeck = useAppStore((s) => s.setFocusDeck);
  const deck = allDecks().find((d) => d.id === id);
  if (!deck) return <Navigate to="/learn/vocab" replace />;

  const words = allWords(vocab.myWords).filter((w) => w.deck === deck.id);
  const isFocus = vocab.focusDeck === deck.id;

  return (
    <Page
      title={deck.title}
      subtitle={deck.description}
      back={{ to: '/learn/vocab', label: 'Vocabulary' }}
    >
      <VoiceNotice />
      <Card>
        <p className={muted}>
          {isFocus
            ? 'New words come from this deck first.'
            : 'Want these words now? Move this deck to the front of the queue.'}
        </p>
        <button
          type="button"
          className={`${isFocus ? btnSecondary : btnPrimary} mt-3 w-full`}
          onClick={() => void setFocusDeck(isFocus ? null : deck.id)}
        >
          {isFocus ? 'Back to the normal order' : 'Learn this deck next'}
        </button>
      </Card>
      <Card>
        <h2 className="font-semibold">{words.length} words</h2>
        {words.length === 0 && <p className={`mt-1 ${muted}`}>No words here yet.</p>}
        <ul className="divide-y divide-stone-200 dark:divide-stone-800">
          {words.map((word) => (
            <WordRow key={word.id} word={word} stage={stageOf(vocab.cards[word.id])} />
          ))}
        </ul>
      </Card>
    </Page>
  );
}
