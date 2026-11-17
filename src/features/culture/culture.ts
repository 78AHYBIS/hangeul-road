/**
 * Culture logic: the order cards are suggested in, today's culture task, and topic
 * quizzes. Pure: everything is passed in, randomness included.
 */
import {
  CULTURE_CARDS,
  CULTURE_TOPICS,
  cardsInTopic,
  findTopic,
  type CultureCard,
  type CultureQuizQuestion,
  type CultureTopic,
} from '../../content/culture';
import type { CultureProgress } from '../../lib/cultureProgress';
import type { ISODate } from '../../lib/date';
import type { StageId } from '../../lib/roadmap';
import type { ExtraTask } from '../daily/tasks';
import { shuffle, type Rng } from '../hangul/drills';

/** Close to departure and after arrival, the practical topics come first. */
const ARRIVAL_FIRST = [
  'culture-topic-ulsan',
  'culture-topic-safety',
  'culture-topic-transport',
  'culture-topic-dorm',
  'culture-topic-money',
  'culture-topic-food',
];

function topicOrder(stage: StageId): string[] {
  const all = CULTURE_TOPICS.map((t) => t.id);
  if (stage !== 'arrival' && stage !== 'in-korea') return all;
  return [...ARRIVAL_FIRST, ...all.filter((id) => !ARRIVAL_FIRST.includes(id))];
}

/**
 * The order cards are suggested on Today: one card from each topic in turn, so the
 * days vary. Within a topic, cards keep their file order.
 */
export function cultureOrder(stage: StageId): CultureCard[] {
  const queues = topicOrder(stage).map((id) => cardsInTopic(id));
  const order: CultureCard[] = [];
  for (let round = 0; order.length < CULTURE_CARDS.length; round++) {
    for (const queue of queues) {
      const card = queue[round];
      if (card) order.push(card);
    }
  }
  return order;
}

function cardTask(card: CultureCard, done: boolean, again = false): ExtraTask {
  return {
    id: card.id,
    card: card.id,
    title: `${again ? 'Read again' : 'Korea life'}: ${card.title}`,
    detail: card.summary,
    to: `/korea/card/${card.id}`,
    done,
  };
}

function quizTask(topic: CultureTopic, done: boolean): ExtraTask {
  return {
    id: `quiz:${topic.id}`,
    title: `Culture quiz: ${topic.title}`,
    detail: `${topic.quiz.length} quick questions on what you read.`,
    to: `/korea/topic/${topic.id}/quiz`,
    done,
  };
}

/**
 * Today's culture card (Phase 6 fills PlanInput.culture with it):
 * 1. a card or quiz done today stays, ticked, for the rest of the day;
 * 2. the quiz of a topic whose cards are all read, if not taken yet;
 * 3. the next unread card, in `cultureOrder`;
 * 4. once everything is read and every quiz taken, the card read longest ago, again.
 */
export function cultureTaskForToday(
  progress: CultureProgress,
  today: ISODate,
  stage: StageId,
): ExtraTask | null {
  const order = cultureOrder(stage);
  const readToday = order.find((c) => progress.read[c.id] === today);
  if (readToday) return cardTask(readToday, true);
  const quizToday = CULTURE_TOPICS.find((t) => progress.results[t.id]?.date === today);
  if (quizToday) return quizTask(quizToday, true);

  const readAll = (topicId: string) => cardsInTopic(topicId).every((c) => progress.read[c.id]);
  const quizDue = topicOrder(stage)
    .map((id) => findTopic(id)!)
    .find((t) => t.quiz.length > 0 && readAll(t.id) && !progress.results[t.id]);
  if (quizDue) return quizTask(quizDue, false);

  const next = order.find((c) => !progress.read[c.id]);
  if (next) return cardTask(next, false);

  const oldest = [...order].sort((a, b) =>
    progress.read[a.id]! < progress.read[b.id]!
      ? -1
      : progress.read[a.id]! > progress.read[b.id]!
        ? 1
        : 0,
  )[0];
  return oldest ? cardTask(oldest, false, true) : null;
}

export interface CultureQuestion extends CultureQuizQuestion {
  /** The options, shuffled. */
  shuffled: string[];
}

/** A topic's quiz with questions and options in a random order. */
export function buildCultureQuiz(topic: CultureTopic, rng: Rng): CultureQuestion[] {
  return shuffle(topic.quiz, rng).map((q) => ({ ...q, shuffled: shuffle(q.options, rng) }));
}

/** Read counts for a topic, for lists. */
export function topicProgress(topicId: string, progress: CultureProgress) {
  const cards = cardsInTopic(topicId);
  return { read: cards.filter((c) => progress.read[c.id]).length, total: cards.length };
}
