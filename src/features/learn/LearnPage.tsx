import { Link } from 'react-router-dom';
import { Card, ComingSoon, Page } from '../../components/Page';
import { muted } from '../../components/ui';

export function LearnPage() {
  return (
    <Page title="Learn" subtitle="Hangul, words, grammar and phrases.">
      <Link to="/learn/hangul" className="block">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Hangul</h2>
            <span className="text-2xl text-teal-700 dark:text-teal-400" aria-hidden="true">
              한글 ›
            </span>
          </div>
          <p className={`mt-1 ${muted}`}>All 40 letters, sound rules, drills and typing.</p>
        </Card>
      </Link>
      <Link to="/learn/vocab" className="block">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Vocabulary</h2>
            <span className="text-2xl text-teal-700 dark:text-teal-400" aria-hidden="true">
              단어 ›
            </span>
          </div>
          <p className={`mt-1 ${muted}`}>
            15 themed decks with spaced repetition, plus a number trainer.
          </p>
        </Card>
      </Link>
      <ComingSoon
        items={[
          { title: 'Grammar', text: 'Short lessons for polite sentences.', phase: 5 },
          { title: 'Phrases', text: 'Situation packs and an offline phrasebook.', phase: 5 },
        ]}
      />
    </Page>
  );
}
