import { Link, Navigate, useParams } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { btnPrimary, btnSecondary, muted } from '../../components/ui';
import { findGrammarLesson } from '../../content/grammar';
import { findPack } from '../../content/phrases';
import { formatLongDate } from '../../lib/date';
import { useAppStore } from '../../lib/storage/store';
import { SpeakButton, VoiceNotice } from '../hangul/shared';
import { PhraseRow } from './PhraseRow';
import { MixedText } from '../../components/MixedText';

export function PackPage() {
  const { id } = useParams();
  const pack = findPack(id);
  const done = useAppStore((s) => (pack ? s.phrases.done.includes(pack.id) : false));
  const result = useAppStore((s) => (pack ? s.phrases.results[pack.id] : undefined));
  const markPackDone = useAppStore((s) => s.markPackDone);
  if (!pack) return <Navigate to="/learn/phrases" replace />;

  const grammar = (pack.refs ?? []).map(findGrammarLesson).filter((l) => l !== undefined);

  return (
    <Page title={pack.title} back={{ to: '/learn/phrases', label: 'Phrases' }}>
      <VoiceNotice />
      <p className="leading-relaxed">
        <MixedText text={pack.situation} />
      </p>
      {pack.lastVerified && (
        <p className={muted}>Checked on {formatLongDate(pack.lastVerified)}.</p>
      )}

      <Card>
        <h2 className="font-semibold">Dialogue</h2>
        <ul className="mt-2 space-y-3">
          {pack.dialogue.map((line, i) => {
            const you = line.speaker === 'You';
            return (
              <li
                key={i}
                className={`rounded-2xl p-3 ${
                  you ? 'ml-6 bg-teal-50 dark:bg-teal-950' : 'mr-6 bg-stone-100 dark:bg-stone-800'
                }`}
              >
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                  {line.speaker}
                </p>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-lg" lang="ko">
                      {line.korean}
                    </p>
                    <p className={muted}>{line.meaning}</p>
                  </div>
                  <SpeakButton text={line.korean} label="Play" compact />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <h2 className="font-semibold">Key phrases</h2>
        <p className={`mt-1 ${muted}`}>Tap ☆ to keep a phrase at the top of your phrasebook.</p>
        <ul className="mt-1 divide-y divide-stone-200 dark:divide-stone-800">
          {pack.phrases.map((phrase) => (
            <PhraseRow key={phrase.id} phrase={phrase} />
          ))}
        </ul>
      </Card>

      {grammar.length > 0 && (
        <p className={muted}>
          Grammar used here:{' '}
          {grammar.map((lesson, i) => (
            <span key={lesson.id}>
              {i > 0 && ', '}
              <Link
                to={`/learn/grammar/${lesson.id}`}
                className="text-teal-700 underline underline-offset-2 dark:text-teal-400"
              >
                <MixedText text={lesson.title} />
              </Link>
            </span>
          ))}
        </p>
      )}

      <div className="space-y-3">
        <Link
          to={`/learn/phrases/${pack.id}/quiz`}
          className={`${btnPrimary} flex w-full items-center justify-center`}
        >
          {result ? `Quiz again (last: ${result.correct} / ${result.total})` : 'Take the quiz'}
        </Link>
        {!done && (
          <button
            type="button"
            className={`${btnSecondary} w-full`}
            onClick={() => void markPackDone(pack.id)}
          >
            Mark as done without the quiz
          </button>
        )}
      </div>
    </Page>
  );
}
