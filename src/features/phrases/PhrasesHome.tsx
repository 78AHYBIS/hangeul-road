import { LinkRow } from '../../components/LinkRow';
import { Card, Page } from '../../components/Page';
import { muted } from '../../components/ui';
import { PHRASE_PACKS } from '../../content/phrases';
import { useAppStore } from '../../lib/storage/store';

export function PhrasesHome() {
  const phrases = useAppStore((s) => s.phrases);
  const doneCount = PHRASE_PACKS.filter((p) => phrases.done.includes(p.id)).length;

  return (
    <Page
      title="Phrases"
      subtitle="Get through real situations politely."
      back={{ to: '/learn', label: 'Learn' }}
    >
      <Card>
        <ul className="divide-y divide-stone-200 dark:divide-stone-800">
          <LinkRow
            to="/learn/phrases/book"
            title="Phrasebook"
            text={`Large phrase cards to read out or show. Works offline. ${phrases.starred.length} starred.`}
          />
          <LinkRow
            to="/learn/phrases/intro"
            title="My self-introduction"
            text="Fill in your details and get a correct polite introduction."
          />
        </ul>
      </Card>
      <Card>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">Situation packs</h2>
          <p className={muted} data-testid="packs-count">
            {doneCount} / {PHRASE_PACKS.length} done
          </p>
        </div>
        <p className={`mt-1 ${muted}`}>A short dialogue, key phrases with audio, and a quiz.</p>
        <ul className="mt-2 divide-y divide-stone-200 dark:divide-stone-800">
          {PHRASE_PACKS.map((pack) => (
            <LinkRow
              key={pack.id}
              to={`/learn/phrases/${pack.id}`}
              title={pack.title}
              text={`${pack.phrases.length} phrases`}
              done={phrases.done.includes(pack.id)}
            />
          ))}
        </ul>
      </Card>
    </Page>
  );
}
