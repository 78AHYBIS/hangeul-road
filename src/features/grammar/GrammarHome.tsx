import { LinkRow } from '../../components/LinkRow';
import { Card, Page } from '../../components/Page';
import { muted } from '../../components/ui';
import { GRAMMAR_LESSONS } from '../../content/grammar';
import { useAppStore } from '../../lib/storage/store';

export function GrammarHome() {
  const grammar = useAppStore((s) => s.grammar);
  const doneCount = GRAMMAR_LESSONS.filter((l) => grammar.done.includes(l.id)).length;

  return (
    <Page
      title="Grammar"
      subtitle="Short lessons for simple polite sentences."
      back={{ to: '/learn', label: 'Learn' }}
    >
      <Card>
        <p className={muted} data-testid="grammar-count">
          {doneCount} of {GRAMMAR_LESSONS.length} lessons done
        </p>
        <p className={`mt-1 ${muted}`}>
          Take them in order: each lesson uses the ones before it. Each has an explanation, examples
          with audio, and a few minutes of practice.
        </p>
      </Card>
      <Card>
        <ol className="divide-y divide-stone-200 dark:divide-stone-800">
          {GRAMMAR_LESSONS.map((lesson, i) => {
            const result = grammar.results[lesson.id];
            return (
              <LinkRow
                key={lesson.id}
                to={`/learn/grammar/${lesson.id}`}
                title={`${i + 1}. ${lesson.title}`}
                text={
                  result
                    ? `${lesson.summary} Last practice: ${result.correct} / ${result.total}`
                    : lesson.summary
                }
                done={grammar.done.includes(lesson.id)}
              />
            );
          })}
        </ol>
      </Card>
    </Page>
  );
}
