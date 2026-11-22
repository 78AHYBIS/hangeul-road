import { Navigate, useParams } from 'react-router-dom';
import { MixedText } from '../../components/MixedText';
import { Card, Page } from '../../components/Page';
import { btnSecondary, muted } from '../../components/ui';
import { CATEGORY_TITLE, findApp, type KoreaApp } from '../../content/korea-apps';
import { formatLongDate } from '../../lib/date';
import { androidLink, relatedApps } from './guide';
import { CARD_LABEL, ENGLISH_LABEL, NUMBER_LABEL, SETUP_LABEL } from './labels';
import { RelatedLinks } from './shared';

export function AppPage() {
  const { id } = useParams();
  const app = findApp(id);
  if (!app) return <Navigate to="/korea/apps" replace />;
  return <AppView app={app} />;
}

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;

function AppView({ app }: { app: KoreaApp }) {
  const android = androidLink(app);
  const facts: [string, string][] = [
    ['English interface', ENGLISH_LABEL[app.english]],
    ['Korean phone number', NUMBER_LABEL[app.koreanNumber]],
    ['ARC (Residence Card)', NUMBER_LABEL[app.arc]],
    ['Foreign cards', CARD_LABEL[app.foreignCards]],
  ];
  // Related apps first, then the item's own refs (cards, resources), without repeats.
  const related = [...new Set([...relatedApps(app).map((a) => a.id), ...(app.refs ?? [])])];

  return (
    <Page title={app.name} back={{ to: '/korea/apps', label: 'Korea apps' }}>
      <p className={muted}>
        {app.korean && (
          <span lang="ko" className="mr-2 text-base text-stone-700 dark:text-stone-200">
            {app.korean}
          </span>
        )}
        {CATEGORY_TITLE[app.category]}
      </p>

      <p className="text-lg leading-relaxed font-medium">
        <MixedText text={app.what} />
      </p>
      <p className="leading-relaxed">
        <span className="font-semibold">Why locals use it: </span>
        <MixedText text={app.why} />
      </p>

      <Card>
        <h2 className="font-semibold">Can I use it?</h2>
        <dl className="mt-2 divide-y divide-stone-200 dark:divide-stone-800" data-testid="access">
          {facts.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-3 py-2">
              <dt className={muted}>{label}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-3 py-2">
            <dt className={muted}>When</dt>
            <dd className="text-right font-medium">{SETUP_LABEL[app.setup]}</dd>
          </div>
        </dl>
        {app.disputed && (
          <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-50">
            Sources disagree on part of this. Details below.
          </p>
        )}
        <p className="mt-3 text-sm leading-relaxed">
          <MixedText text={app.access} />
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {app.stores.ios ? (
          <a
            href={app.stores.ios}
            {...external}
            className={`${btnSecondary} flex items-center justify-center`}
          >
            App Store
          </a>
        ) : (
          <p className={`${muted} self-center`}>Search the App Store for “{app.name}”.</p>
        )}
        <a
          href={android.url}
          {...external}
          className={`${btnSecondary} flex items-center justify-center text-center`}
        >
          {android.verified ? 'Google Play' : 'Search Google Play'}
        </a>
      </div>
      {app.web && (
        <a
          href={app.web}
          {...external}
          className="-mt-2 inline-flex min-h-10 items-center text-sm font-medium text-teal-700 underline underline-offset-2 dark:text-teal-400"
        >
          Website
        </a>
      )}

      <RelatedLinks ids={related} />

      <footer className={`space-y-1 border-t border-stone-200 pt-3 dark:border-stone-800 ${muted}`}>
        <p data-testid="sources">
          Sources:{' '}
          {app.sources.map((source, i) => (
            <span key={source.url}>
              {i > 0 && ', '}
              <a
                href={source.url}
                {...external}
                className="text-teal-700 underline underline-offset-2 dark:text-teal-400"
              >
                {source.name}
              </a>
            </span>
          ))}
        </p>
        <p>
          Checked on {formatLongDate(app.lastVerified)} by web search. Rules for foreigners change
          often; try the sign-up yourself before you rely on it.
        </p>
      </footer>
    </Page>
  );
}
