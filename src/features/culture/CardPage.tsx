import { Link, Navigate, useParams } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { btnPrimary, btnSecondary, muted } from '../../components/ui';
import { cardsInTopic, findCard, findTopic, type CultureCard } from '../../content/culture';
import { formatLongDate } from '../../lib/date';
import { useAppStore } from '../../lib/storage/store';
import { SpeakButton, VoiceNotice } from '../hangul/shared';
import { MixedText } from '../../components/MixedText';

function AdviceList({ title, items, mark }: { title: string; items: string[]; mark: string }) {
  return (
    <Card>
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 leading-relaxed">
            <span aria-hidden="true" className="shrink-0 text-teal-700 dark:text-teal-400">
              {mark}
            </span>
            <span>
              <MixedText text={item} />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function CardPage() {
  const { id } = useParams();
  const card = findCard(id);
  if (!card) return <Navigate to="/korea" replace />;
  return <CultureCardView key={card.id} card={card} />;
}

function CultureCardView({ card }: { card: CultureCard }) {
  const topic = findTopic(card.topic)!;
  const readOn = useAppStore((s) => s.culture.read[card.id]);
  const setCardRead = useAppStore((s) => s.setCardRead);
  const siblings = cardsInTopic(topic.id);
  const next = siblings[siblings.indexOf(card) + 1];

  return (
    <Page title={card.title} back={{ to: `/korea/topic/${topic.id}`, label: topic.title }}>
      <p className="text-lg leading-relaxed font-medium">
        <MixedText text={card.summary} />
      </p>
      {card.body.map((paragraph) => (
        <p key={paragraph} className="leading-relaxed">
          <MixedText text={paragraph} />
        </p>
      ))}

      <AdviceList title="What to do" items={card.do} mark="✓" />
      <AdviceList title="What to avoid" items={card.avoid} mark="–" />

      {card.varies && (
        <p className="rounded-2xl bg-stone-100 p-4 text-sm leading-relaxed dark:bg-stone-800">
          <span className="font-semibold">This varies. </span>
          <MixedText text={card.varies} />
        </p>
      )}

      <VoiceNotice />
      <Card>
        <h2 className="font-semibold">Korean words</h2>
        <ul className="mt-1 divide-y divide-stone-200 dark:divide-stone-800">
          {card.words.map((word) => (
            <li key={word.korean} className="flex items-center gap-2 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-lg" lang="ko">
                  {word.korean}
                </p>
                <p className={muted}>
                  <MixedText text={word.meaning} />
                </p>
              </div>
              <SpeakButton text={word.korean} label="Play" compact />
            </li>
          ))}
        </ul>
      </Card>

      {(card.sources || card.lastVerified) && (
        <footer
          className={`space-y-1 border-t border-stone-200 pt-3 dark:border-stone-800 ${muted}`}
        >
          {card.sources && (
            <p data-testid="sources">
              Sources:{' '}
              {card.sources.map((source, i) => (
                <span key={source.url}>
                  {i > 0 && ', '}
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 underline underline-offset-2 dark:text-teal-400"
                  >
                    {source.name}
                  </a>
                </span>
              ))}
            </p>
          )}
          {card.lastVerified && (
            <p>
              Checked on {formatLongDate(card.lastVerified)}. Details like times and prices change;
              check again close to the date.
            </p>
          )}
        </footer>
      )}

      <div className="space-y-3">
        {readOn ? (
          <>
            <p role="status" className="text-center font-medium text-teal-700 dark:text-teal-400">
              ✓ Read on {formatLongDate(readOn)}
            </p>
            {next && (
              <Link
                to={`/korea/card/${next.id}`}
                className={`${btnPrimary} flex w-full items-center justify-center`}
              >
                <span>
                  Next: <MixedText text={next.title} />
                </span>
              </Link>
            )}
            {!next && (
              <Link
                to={`/korea/topic/${topic.id}/quiz`}
                className={`${btnPrimary} flex w-full items-center justify-center`}
              >
                Topic quiz
              </Link>
            )}
            <button
              type="button"
              className={`${btnSecondary} w-full`}
              onClick={() => void setCardRead(card.id, false)}
            >
              Mark as unread
            </button>
          </>
        ) : (
          <button
            type="button"
            className={`${btnPrimary} w-full`}
            onClick={() => void setCardRead(card.id, true)}
          >
            Done reading
          </button>
        )}
      </div>
    </Page>
  );
}
