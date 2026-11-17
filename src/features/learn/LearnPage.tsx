import { Link } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { muted } from '../../components/ui';
import { GRAMMAR_LESSONS } from '../../content/grammar';
import { PHRASE_PACKS } from '../../content/phrases';

const SECTIONS = [
  {
    to: '/learn/hangul',
    title: 'Hangul',
    korean: '한글',
    text: 'All 40 letters, sound rules, drills and typing.',
  },
  {
    to: '/learn/vocab',
    title: 'Vocabulary',
    korean: '단어',
    text: '15 themed decks with spaced repetition, plus a number trainer.',
  },
  {
    to: '/learn/grammar',
    title: 'Grammar',
    korean: '문법',
    text: `${GRAMMAR_LESSONS.length} short lessons for simple polite sentences, with practice.`,
  },
  {
    to: '/learn/phrases',
    title: 'Phrases',
    korean: '표현',
    text: `${PHRASE_PACKS.length} situation packs, your self-introduction and an offline phrasebook.`,
  },
];

export function LearnPage() {
  return (
    <Page title="Learn" subtitle="Hangul, words, grammar and phrases.">
      {SECTIONS.map((s) => (
        <Link key={s.to} to={s.to} className="block">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{s.title}</h2>
              <span className="text-2xl text-teal-700 dark:text-teal-400" aria-hidden="true">
                {s.korean} ›
              </span>
            </div>
            <p className={`mt-1 ${muted}`}>{s.text}</p>
          </Card>
        </Link>
      ))}
    </Page>
  );
}
