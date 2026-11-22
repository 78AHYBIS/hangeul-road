import { Link } from 'react-router-dom';
import { LinkRow } from '../../components/LinkRow';
import { Card, Page } from '../../components/Page';
import { muted } from '../../components/ui';
import {
  CULTURE_CARDS,
  CULTURE_TOPICS,
  ULSAN_TOPIC_ID,
  cardsInTopic,
  findTopic,
} from '../../content/culture';
import { APP_WORDS, CHECKLISTS, HOW_TOS, KOREA_APPS } from '../../content/korea-apps';
import { useAppStore } from '../../lib/storage/store';
import { topicProgress } from '../culture/culture';
import { checklistStatus } from './guide';

export function KoreaPage() {
  const culture = useAppStore((s) => s.culture);
  const ulsan = findTopic(ULSAN_TOPIC_ID)!;
  const topics = CULTURE_TOPICS.filter((t) => t.id !== ULSAN_TOPIC_ID);
  const readCount = CULTURE_CARDS.filter((c) => culture.read[c.id]).length;
  const koreaGuide = useAppStore((s) => s.koreaGuide);
  const checklists = CHECKLISTS.map((c) => checklistStatus(c, koreaGuide));
  const ticked = checklists.reduce((sum, c) => sum + c.done, 0);
  const items = checklists.reduce((sum, c) => sum + c.total, 0);

  return (
    <Page title="Korea" subtitle="Culture, daily life and the apps you will need.">
      <Card>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">Ulsan and UNIST</h2>
          <span className={muted} lang="ko">
            {ulsan.korean}
          </span>
        </div>
        <p className={`mt-1 ${muted}`}>{ulsan.intro}</p>
        <ul className="mt-2 divide-y divide-stone-200 dark:divide-stone-800">
          {cardsInTopic(ulsan.id).map((card) => (
            <LinkRow
              key={card.id}
              to={`/korea/card/${card.id}`}
              title={card.title}
              text={card.summary}
              done={Boolean(culture.read[card.id])}
            />
          ))}
          <LinkRow
            to={`/korea/topic/${ulsan.id}/quiz`}
            title="Quiz: Ulsan and UNIST"
            text={quizText(culture.results[ulsan.id], ulsan.quiz.length)}
            done={Boolean(culture.results[ulsan.id])}
          />
        </ul>
      </Card>

      <Card>
        <h2 className="font-semibold">Apps and arrival guide</h2>
        <p className={`mt-1 ${muted}`}>
          What to install, what you can only set up after you arrive, and what to do first.
        </p>
        <ul className="mt-2 divide-y divide-stone-200 dark:divide-stone-800">
          <LinkRow
            to="/korea/apps"
            title="Korea apps"
            text={`${KOREA_APPS.length} apps: maps, taxis, delivery, banks. What needs a Korean number or an ARC.`}
          />
          <LinkRow
            to="/korea/checklists"
            title="Arrival checklists"
            text={`Before I fly, first week, after my ARC · ${ticked} / ${items} done`}
            done={ticked === items}
          />
          <LinkRow
            to="/korea/howto"
            title="How do I…"
            text={`${HOW_TOS.length} quick answers: the airport to Ulsan, a taxi, food, a parcel, a pharmacy.`}
          />
          <LinkRow
            to="/korea/app-words"
            title="Words in Korean apps"
            text={`${APP_WORDS.length} buttons and labels, such as 결제, 취소 and 배달.`}
          />
        </ul>
      </Card>

      <Card>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">Culture and daily life</h2>
          <p className={muted} data-testid="culture-count">
            {readCount} / {CULTURE_CARDS.length} read
          </p>
        </div>
        <p className={`mt-1 ${muted}`}>
          Short cards: what to do, what to avoid and the Korean words for it. One appears on Today
          each day.
        </p>
        <ul className="mt-2 divide-y divide-stone-200 dark:divide-stone-800">
          {topics.map((topic) => {
            const { read, total } = topicProgress(topic.id, culture);
            const result = culture.results[topic.id];
            return (
              <LinkRow
                key={topic.id}
                to={`/korea/topic/${topic.id}`}
                title={topic.title}
                text={`${read} / ${total} read${result ? ` · quiz ${result.correct} / ${result.total}` : ''}`}
                done={read === total && Boolean(result)}
              />
            );
          })}
        </ul>
      </Card>

      <p className={muted}>
        Facts that can change (dates, numbers, routes) show when they were last checked. For safety
        numbers, see{' '}
        <Link
          to="/korea/card/culture-emergency-numbers"
          className="text-teal-700 underline underline-offset-2 dark:text-teal-400"
        >
          Emergency numbers
        </Link>
        .
      </p>
    </Page>
  );
}

function quizText(result: { correct: number; total: number } | undefined, count: number): string {
  return result
    ? `Last score ${result.correct} / ${result.total}`
    : `${count} quick questions on the cards above.`;
}
