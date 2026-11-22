import { Card, Page } from '../../components/Page';
import { muted } from '../../components/ui';
import { formatLongDate, todayISO } from '../../lib/date';
import { useAppStore } from '../../lib/storage/store';
import { weekSummary } from '../daily/weekly';
import { allWords } from '../vocab/words';

export function WeeklyPage() {
  const activity = useAppStore((s) => s.activity);
  const hangul = useAppStore((s) => s.hangul);
  const vocab = useAppStore((s) => s.vocab);
  const summary = weekSummary(activity, hangul, vocab.cards, todayISO());
  const words = new Map(allWords(vocab.myWords).map((w) => [w.id, w]));
  const week = summary.totals;

  const stats = [
    { label: 'days studied', value: `${week.daysStudied} / 7` },
    { label: 'new words', value: String(week.newWords) },
    {
      label: 'accuracy',
      value: week.accuracy === null ? 'no data' : `${Math.round(week.accuracy * 100)}%`,
    },
    { label: 'answers', value: String(week.reviews + week.answers) },
  ];

  return (
    <Page
      title="Weekly review"
      subtitle={`${formatLongDate(summary.from)} to ${formatLongDate(summary.to)}`}
      back={{ to: '/me', label: 'Me' }}
    >
      <Card>
        <dl className="grid grid-cols-2 gap-2 text-center" data-testid="week-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-stone-100 py-3 dark:bg-stone-800">
              <dd className="text-2xl font-bold tabular-nums">{stat.value}</dd>
              <dt className="text-xs text-stone-600 dark:text-stone-400">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </Card>

      <Card tone="accent">
        <p className="text-sm text-teal-100">Focus for next week</p>
        <p className="mt-1 text-lg font-medium" data-testid="week-focus">
          {summary.focus}
        </p>
      </Card>

      <Card>
        <h2 className="font-semibold">Weakest items</h2>
        {summary.weakLetters.length === 0 && summary.hardWords.length === 0 && (
          <p className={`mt-1 ${muted}`}>Nothing stands out yet.</p>
        )}
        {summary.weakLetters.length > 0 && (
          <>
            <p className={`mt-2 ${muted}`}>Letters, by recent drill accuracy</p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {summary.weakLetters.map((letter) => (
                <li
                  key={letter.jamo}
                  className="rounded-lg bg-stone-100 px-3 py-1.5 dark:bg-stone-800"
                >
                  <span className="text-xl" lang="ko">
                    {letter.jamo}
                  </span>{' '}
                  <span className={muted}>{Math.round(letter.accuracy * 100)}%</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {summary.hardWords.length > 0 && (
          <>
            <p className={`mt-3 ${muted}`}>Words forgotten most often</p>
            <ul className="mt-1 divide-y divide-stone-200 dark:divide-stone-800">
              {summary.hardWords.map((id) => (
                <li key={id} className="flex items-baseline justify-between gap-3 py-2">
                  <span className="text-lg" lang="ko">
                    {words.get(id)?.korean ?? id}
                  </span>
                  <span className={muted}>{words.get(id)?.meaning}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </Page>
  );
}
