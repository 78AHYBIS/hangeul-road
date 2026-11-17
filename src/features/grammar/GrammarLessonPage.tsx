import { Link, Navigate, useParams } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { btnPrimary, btnSecondary, muted } from '../../components/ui';
import { GRAMMAR_LESSONS, findGrammarLesson } from '../../content/grammar';
import { PHRASE_PACKS } from '../../content/phrases';
import { useAppStore } from '../../lib/storage/store';
import { SpeakButton, VoiceNotice } from '../hangul/shared';

export function GrammarLessonPage() {
  const { id } = useParams();
  const lesson = findGrammarLesson(id);
  const done = useAppStore((s) => (lesson ? s.grammar.done.includes(lesson.id) : false));
  const markGrammarDone = useAppStore((s) => s.markGrammarDone);
  if (!lesson) return <Navigate to="/learn/grammar" replace />;

  const index = GRAMMAR_LESSONS.indexOf(lesson);
  const next = GRAMMAR_LESSONS[index + 1];
  const packs = PHRASE_PACKS.filter((p) => p.refs?.includes(lesson.id));

  return (
    <Page
      title={lesson.title}
      subtitle={`Lesson ${index + 1} of ${GRAMMAR_LESSONS.length}`}
      back={{ to: '/learn/grammar', label: 'Grammar' }}
    >
      <VoiceNotice />
      <Card tone="accent">
        <p className="text-sm text-teal-100">Pattern</p>
        <p className="mt-1 text-xl font-semibold" lang="ko" data-testid="pattern">
          {lesson.pattern}
        </p>
        <p className="mt-1 text-sm text-teal-100">{lesson.summary}</p>
      </Card>

      <div className="space-y-3 leading-relaxed">
        {lesson.explanation.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <Card>
        <h2 className="font-semibold">Examples</h2>
        <ul className="mt-2 divide-y divide-stone-200 dark:divide-stone-800">
          {lesson.examples.map((example) => (
            <li key={example.korean} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-xl" lang="ko">
                  {example.korean}
                </p>
                <p className={muted}>{example.meaning}</p>
                {example.note && <p className={`mt-0.5 ${muted} italic`}>{example.note}</p>}
              </div>
              <SpeakButton text={example.korean} label="Play" compact />
            </li>
          ))}
        </ul>
      </Card>

      {packs.length > 0 && (
        <p className={muted}>
          Used in the phrase packs:{' '}
          {packs.map((pack, i) => (
            <span key={pack.id}>
              {i > 0 && ', '}
              <Link
                to={`/learn/phrases/${pack.id}`}
                className="text-teal-700 underline underline-offset-2 dark:text-teal-400"
              >
                {pack.title}
              </Link>
            </span>
          ))}
        </p>
      )}

      <div className="space-y-3">
        <Link
          to={`/learn/grammar/${lesson.id}/practice`}
          className={`${btnPrimary} flex w-full items-center justify-center`}
        >
          Practice ({lesson.practice.length} questions)
        </Link>
        {done ? (
          next && (
            <Link
              to={`/learn/grammar/${next.id}`}
              className={`${btnSecondary} flex w-full items-center justify-center`}
            >
              Next lesson: {next.title}
            </Link>
          )
        ) : (
          <button
            type="button"
            className={`${btnSecondary} w-full`}
            onClick={() => void markGrammarDone(lesson.id)}
          >
            Mark as done without practice
          </button>
        )}
      </div>
    </Page>
  );
}
