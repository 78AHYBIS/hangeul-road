import { Link } from 'react-router-dom';
import { MixedText } from '../../components/MixedText';
import { Card, Page } from '../../components/Page';
import { btnPrimary, muted } from '../../components/ui';
import { GLOSSARY_GROUPS, GLOSSARY_GROUP_TITLE } from '../../content/korea-apps';
import { DECKS } from '../../content/vocab';
import { useAppStore } from '../../lib/storage/store';
import { SpeakButton, VoiceNotice } from '../hangul/shared';
import { appWordEntries } from './guide';

const APP_DECK = 'deck-apps';

export function AppWordsPage() {
  const focusDeck = useAppStore((s) => s.vocab.focusDeck);
  const setFocusDeck = useAppStore((s) => s.setFocusDeck);
  const entries = appWordEntries();
  const deckTitle = (id: string) => DECKS.find((d) => d.id === id)?.title ?? id;

  return (
    <Page
      title="Words in Korean apps"
      subtitle="Buttons and labels you will tap every day. Each one is also in a vocabulary deck."
      back={{ to: '/korea', label: 'Korea' }}
    >
      <Card>
        <p className="leading-relaxed">
          The new words are in the deck <span className="font-medium">{deckTitle(APP_DECK)}</span>;
          the others were already in your decks.
        </p>
        {focusDeck === APP_DECK ? (
          <p role="status" className="mt-3 font-medium text-teal-700 dark:text-teal-400">
            ✓ These words come next in your reviews.
          </p>
        ) : (
          <button
            type="button"
            className={`${btnPrimary} mt-3 w-full`}
            onClick={() => void setFocusDeck(APP_DECK)}
          >
            Learn this deck next
          </button>
        )}
      </Card>

      <VoiceNotice />

      {GLOSSARY_GROUPS.map((group) => (
        <section key={group} aria-labelledby={`group-${group}`}>
          <h2 id={`group-${group}`} className="mb-2 text-lg font-semibold">
            {GLOSSARY_GROUP_TITLE[group]}
          </h2>
          <Card>
            <ul className="divide-y divide-stone-200 dark:divide-stone-800" data-testid="app-words">
              {entries
                .filter((e) => e.group === group)
                .map((entry) => (
                  <li key={entry.id} className="flex items-center gap-2 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg" lang="ko">
                        {entry.korean}
                      </p>
                      <p className={muted}>
                        <MixedText text={entry.vocab.meaning} />
                        {entry.vocab.korean !== entry.korean && (
                          <>
                            {' · '}
                            <MixedText text={`deck word ${entry.vocab.korean}`} />
                          </>
                        )}
                      </p>
                      <Link
                        to={`/learn/vocab/deck/${entry.vocab.deck}`}
                        className="inline-flex min-h-10 items-center text-sm text-teal-700 underline underline-offset-2 dark:text-teal-400"
                      >
                        {deckTitle(entry.vocab.deck)}
                      </Link>
                    </div>
                    <SpeakButton text={entry.korean} label="Play" compact />
                  </li>
                ))}
            </ul>
          </Card>
        </section>
      ))}
    </Page>
  );
}
