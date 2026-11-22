import { Navigate, useParams } from 'react-router-dom';
import { LinkRow } from '../../components/LinkRow';
import { MixedText } from '../../components/MixedText';
import { Card, Page } from '../../components/Page';
import { muted } from '../../components/ui';
import { HOW_TOS, findHowTo, type HowTo } from '../../content/korea-apps';
import { formatLongDate } from '../../lib/date';
import { RelatedLinks } from './shared';

export function HowToListPage() {
  return (
    <Page
      title="How do I…"
      subtitle="Quick answers for your first weeks."
      back={{ to: '/korea', label: 'Korea' }}
    >
      <Card>
        <ul className="divide-y divide-stone-200 dark:divide-stone-800" data-testid="howtos">
          {HOW_TOS.map((h) => (
            <LinkRow
              key={h.id}
              to={`/korea/howto/${h.id}`}
              title={`…${h.question.toLowerCase()}?`}
              text={h.answer}
            />
          ))}
        </ul>
      </Card>
    </Page>
  );
}

export function HowToPage() {
  const { id } = useParams();
  const howTo = findHowTo(id);
  if (!howTo) return <Navigate to="/korea/howto" replace />;
  return <HowToView howTo={howTo} />;
}

function HowToView({ howTo }: { howTo: HowTo }) {
  return (
    <Page
      title={`How do I ${howTo.question.toLowerCase()}?`}
      back={{ to: '/korea/howto', label: 'How do I…' }}
    >
      <p className="text-lg leading-relaxed font-medium">
        <MixedText text={howTo.answer} />
      </p>
      <Card>
        <ol className="space-y-3">
          {howTo.steps.map((step, i) => (
            <li key={step} className="flex gap-3 leading-relaxed">
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-semibold text-white"
              >
                {i + 1}
              </span>
              <span>
                <MixedText text={step} />
              </span>
            </li>
          ))}
        </ol>
      </Card>
      <RelatedLinks ids={howTo.refs} />
      <footer className={`space-y-1 border-t border-stone-200 pt-3 dark:border-stone-800 ${muted}`}>
        {howTo.sources && (
          <p data-testid="sources">
            Sources:{' '}
            {howTo.sources.map((source, i) => (
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
        <p>
          Checked on {formatLongDate(howTo.lastVerified)}. Details change; check again close to the
          date.
        </p>
      </footer>
    </Page>
  );
}
