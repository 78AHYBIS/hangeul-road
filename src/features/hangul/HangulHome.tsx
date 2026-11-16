import { Link } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { muted } from '../../components/ui';
import { LETTERS, LETTER_LESSONS, RULE_LESSONS, type LetterGroup } from '../../content/hangul';
import { letterStatus, type LetterStatus } from '../../lib/hangulProgress';
import { useAppStore } from '../../lib/storage/store';
import { DRILL_INFO, DRILL_TYPES } from './drills';
import { RomanizationToggle, VoiceNotice } from './shared';

const STATUS_STYLE: Record<LetterStatus, string> = {
  new: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
  learning: 'bg-amber-200 text-amber-950 dark:bg-amber-800 dark:text-amber-50',
  solid: 'bg-teal-700 text-white',
};

const GROUP_TITLES: [LetterGroup, string][] = [
  ['basic-vowels', 'Basic vowels'],
  ['basic-consonants', 'Basic consonants'],
  ['aspirated-consonants', 'Aspirated'],
  ['double-consonants', 'Double'],
  ['compound-vowels', 'Compound vowels'],
];

export function HangulHome() {
  const hangul = useAppStore((s) => s.hangul);
  const statusOf = (jamo: string) => letterStatus(hangul.letters[jamo]);
  const counts = { new: 0, learning: 0, solid: 0 };
  for (const letter of LETTERS) counts[statusOf(letter.korean)]++;

  return (
    <Page
      title="Hangul"
      subtitle="Read any Korean syllable out loud."
      back={{ to: '/learn', label: 'Learn' }}
    >
      <VoiceNotice />

      <Card>
        <h2 className="font-semibold">Progress map</h2>
        <p className={`mt-1 ${muted}`} data-testid="progress-counts">
          {counts.solid} solid · {counts.learning} learning · {counts.new} new
        </p>
        <div className="mt-3 space-y-3">
          {GROUP_TITLES.map(([group, title]) => (
            <div key={group}>
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{title}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {LETTERS.filter((l) => l.group === group).map((letter) => (
                  <Link
                    key={letter.korean}
                    to={`/learn/hangul/lesson/hangul-lesson-${group}?letter=${letter.korean}`}
                    aria-label={`${letter.korean}: ${statusOf(letter.korean)}`}
                    data-status={statusOf(letter.korean)}
                    className={`flex size-10 items-center justify-center rounded-lg text-xl ${STATUS_STYLE[statusOf(letter.korean)]}`}
                  >
                    {letter.korean}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className={`mt-3 ${muted}`}>
          A letter turns solid after at least 6 recent drill answers with 85% correct.
        </p>
      </Card>

      <Card>
        <h2 className="font-semibold">Lessons</h2>
        <ul className="mt-2 divide-y divide-stone-200 dark:divide-stone-800">
          {LETTER_LESSONS.map((lesson) => (
            <Row
              key={lesson.id}
              to={`/learn/hangul/lesson/${lesson.id}`}
              title={lesson.title}
              text={LETTERS.filter((l) => l.group === lesson.group)
                .map((l) => l.korean)
                .join(' ')}
              done={hangul.lessonsDone.includes(lesson.id)}
            />
          ))}
          {RULE_LESSONS.map((rule) => (
            <Row
              key={rule.id}
              to={`/learn/hangul/rule/${rule.id}`}
              title={rule.title}
              text={rule.summary}
              done={hangul.lessonsDone.includes(rule.id)}
            />
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="font-semibold">Practice</h2>
        <ul className="mt-2 divide-y divide-stone-200 dark:divide-stone-800">
          {DRILL_TYPES.map((type) => (
            <Row
              key={type}
              to={`/learn/hangul/drill/${type}`}
              title={DRILL_INFO[type].title}
              text={DRILL_INFO[type].short}
            />
          ))}
          <Row
            to="/learn/hangul/timed"
            title="Timed reading"
            text="30 seconds. Tracks your speed over time."
          />
          <Row
            to="/learn/hangul/typing"
            title="Typing"
            text="The Korean two-set keyboard layout."
          />
        </ul>
      </Card>

      <Card>
        <h2 className="font-semibold">Tools</h2>
        <ul className="mt-2 divide-y divide-stone-200 dark:divide-stone-800">
          <Row
            to="/learn/hangul/builder"
            title="Syllable block builder"
            text="Combine letters and hear the result."
          />
          <Row
            to="/learn/hangul/reading"
            title="Real-world reading"
            text="Loanwords, places, brands, signs and menus."
          />
        </ul>
        <div className="mt-2 border-t border-stone-200 pt-2 dark:border-stone-800">
          <RomanizationToggle />
        </div>
      </Card>
    </Page>
  );
}

function Row({
  to,
  title,
  text,
  done,
}: {
  to: string;
  title: string;
  text: string;
  done?: boolean;
}) {
  return (
    <li>
      <Link to={to} className="flex min-h-14 items-center justify-between gap-3 py-2">
        <span>
          <span className="block font-medium">{title}</span>
          <span className={`block ${muted}`}>{text}</span>
        </span>
        <span className="shrink-0 text-teal-700 dark:text-teal-400">
          {done ? <span aria-label="done">✓</span> : <span aria-hidden="true">›</span>}
        </span>
      </Link>
    </li>
  );
}
