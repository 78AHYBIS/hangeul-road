import { Link, Navigate, useParams } from 'react-router-dom';
import { LinkRow } from '../../components/LinkRow';
import { Card, Page } from '../../components/Page';
import { btnPrimary, muted } from '../../components/ui';
import { cardsInTopic, findTopic } from '../../content/culture';
import { useAppStore } from '../../lib/storage/store';
import { topicProgress } from './culture';
import { MixedText } from '../../components/MixedText';

export function TopicPage() {
  const { id } = useParams();
  const topic = findTopic(id);
  const culture = useAppStore((s) => s.culture);
  if (!topic) return <Navigate to="/korea" replace />;

  const { read, total } = topicProgress(topic.id, culture);
  const result = culture.results[topic.id];

  return (
    <Page title={topic.title} back={{ to: '/korea', label: 'Korea' }}>
      <p className="leading-relaxed">
        <span className={`${muted} mr-2`} lang="ko">
          {topic.korean}
        </span>
        <MixedText text={topic.intro} />
      </p>
      <Card>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">Cards</h2>
          <p className={muted} data-testid="topic-count">
            {read} / {total} read
          </p>
        </div>
        <ul className="mt-1 divide-y divide-stone-200 dark:divide-stone-800">
          {cardsInTopic(topic.id).map((card) => (
            <LinkRow
              key={card.id}
              to={`/korea/card/${card.id}`}
              title={card.title}
              text={card.summary}
              done={Boolean(culture.read[card.id])}
            />
          ))}
        </ul>
      </Card>
      <Link
        to={`/korea/topic/${topic.id}/quiz`}
        className={`${btnPrimary} flex w-full items-center justify-center`}
      >
        {result ? `Quiz again (last: ${result.correct} / ${result.total})` : 'Take the quiz'}
      </Link>
      {!result && read < total && (
        <p className={`${muted} text-center`}>Best after reading the cards, but open any time.</p>
      )}
    </Page>
  );
}
