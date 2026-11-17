import { describe, expect, it } from 'vitest';
import {
  CULTURE_CARDS,
  CULTURE_TOPICS,
  ULSAN_TOPIC_ID,
  cardsInTopic,
  type CultureCard,
} from '../../content/culture';
import {
  EMPTY_CULTURE_PROGRESS,
  sanitizeCultureProgress,
  setRead,
  type CultureProgress,
} from '../../lib/cultureProgress';
import { buildCultureQuiz, cultureOrder, cultureTaskForToday, topicProgress } from './culture';

const TODAY = '2026-12-01';
const YESTERDAY = '2026-11-30';

function readAll(cards: CultureCard[], date: string, from = EMPTY_CULTURE_PROGRESS) {
  return cards.reduce((p, c) => setRead(p, c.id, true, date), from);
}

describe('culture content', () => {
  it('has at least 40 cards, spread over every topic', () => {
    expect(CULTURE_CARDS.length).toBeGreaterThanOrEqual(40);
    for (const topic of CULTURE_TOPICS) {
      expect(cardsInTopic(topic.id).length, topic.id).toBeGreaterThanOrEqual(3);
    }
    // The 11 topics from the spec plus Ulsan and UNIST.
    expect(CULTURE_TOPICS).toHaveLength(12);
  });

  it('gives every card advice both ways and Korean words', () => {
    for (const card of CULTURE_CARDS) {
      expect(card.do.length, card.id).toBeGreaterThan(0);
      expect(card.avoid.length, card.id).toBeGreaterThan(0);
      expect(card.words.length, card.id).toBeGreaterThan(0);
    }
  });

  it('cites official sources with a check date on every Ulsan and UNIST card', () => {
    for (const card of cardsInTopic(ULSAN_TOPIC_ID)) {
      expect(card.sources?.length, card.id).toBeGreaterThan(0);
      expect(card.lastVerified, card.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('dates the time-sensitive cards: holidays, emergency numbers, transport', () => {
    for (const id of [
      'culture-seollal',
      'culture-chuseok',
      'culture-semester-holidays',
      'culture-emergency-numbers',
      'culture-transit-cards',
      'culture-intercity-travel',
      'culture-airport-to-ulsan',
    ]) {
      expect(CULTURE_CARDS.find((c) => c.id === id)?.lastVerified, id).toBeTruthy();
    }
  });

  it('has a quiz for every topic with the answer among the options', () => {
    for (const topic of CULTURE_TOPICS) {
      expect(topic.quiz.length, topic.id).toBeGreaterThanOrEqual(3);
      for (const q of topic.quiz) expect(q.options).toContain(q.answer);
    }
  });
});

describe('cultureOrder', () => {
  it('lists every card once, one topic after another', () => {
    const order = cultureOrder('core');
    expect(new Set(order.map((c) => c.id)).size).toBe(CULTURE_CARDS.length);
    expect(order.slice(0, CULTURE_TOPICS.length).map((c) => c.topic)).toEqual(
      CULTURE_TOPICS.map((t) => t.id),
    );
  });

  it('puts Ulsan and safety first in the arrival weeks', () => {
    const order = cultureOrder('arrival');
    expect(order[0]!.topic).toBe(ULSAN_TOPIC_ID);
    expect(order[1]!.topic).toBe('culture-topic-safety');
  });
});

describe('cultureTaskForToday', () => {
  it('starts with the first card of the first topic', () => {
    const task = cultureTaskForToday(EMPTY_CULTURE_PROGRESS, TODAY, 'hangul')!;
    expect(task.id).toBe(cultureOrder('hangul')[0]!.id);
    expect(task.card).toBe(task.id);
    expect(task.to).toBe(`/korea/card/${task.id}`);
    expect(task.done).toBe(false);
  });

  it('keeps a card read today in place, ticked, then moves on the next day', () => {
    const first = cultureOrder('core')[0]!;
    const progress = setRead(EMPTY_CULTURE_PROGRESS, first.id, true, TODAY);
    expect(cultureTaskForToday(progress, TODAY, 'core')).toMatchObject({
      id: first.id,
      done: true,
    });
    const tomorrow = cultureTaskForToday(progress, '2026-12-02', 'core')!;
    expect(tomorrow.id).toBe(cultureOrder('core')[1]!.id);
    expect(tomorrow.done).toBe(false);
  });

  it('offers the topic quiz once all cards of a topic are read', () => {
    const topic = CULTURE_TOPICS[0]!;
    const progress = readAll(cardsInTopic(topic.id), YESTERDAY);
    const task = cultureTaskForToday(progress, TODAY, 'core')!;
    expect(task.id).toBe(`quiz:${topic.id}`);
    expect(task.to).toBe(`/korea/topic/${topic.id}/quiz`);
    expect(task.card).toBeUndefined();

    // After the quiz (taken today) the quiz task stays, ticked.
    const quizzed: CultureProgress = {
      ...progress,
      results: { [topic.id]: { correct: 3, total: 4, date: TODAY } },
    };
    expect(cultureTaskForToday(quizzed, TODAY, 'core')).toMatchObject({
      id: `quiz:${topic.id}`,
      done: true,
    });
    // The next day, reading continues with another topic.
    const next = cultureTaskForToday(quizzed, '2026-12-02', 'core')!;
    expect(next.card).toBeDefined();
    expect(next.id).not.toMatch(/^quiz:/);
  });

  it('suggests re-reading the oldest card once everything is done', () => {
    let progress = readAll(CULTURE_CARDS, YESTERDAY);
    progress = setRead(progress, 'culture-bowing', true, '2026-11-01');
    progress = {
      ...progress,
      results: Object.fromEntries(
        CULTURE_TOPICS.map((t) => [t.id, { correct: 4, total: 4, date: YESTERDAY }]),
      ),
    };
    const task = cultureTaskForToday(progress, TODAY, 'in-korea')!;
    expect(task.id).toBe('culture-bowing');
    expect(task.title).toMatch(/^Read again/);
    expect(task.done).toBe(false);
  });
});

describe('buildCultureQuiz', () => {
  it('keeps every question and answer, in a shuffled order', () => {
    const topic = CULTURE_TOPICS[0]!;
    let seed = 1;
    const rng = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const quiz = buildCultureQuiz(topic, rng);
    expect(quiz).toHaveLength(topic.quiz.length);
    for (const q of quiz) {
      expect([...q.shuffled].sort()).toEqual([...q.options].sort());
      expect(q.shuffled).toContain(q.answer);
    }
  });
});

describe('culture progress', () => {
  it('sanitizes saved data', () => {
    expect(sanitizeCultureProgress(null)).toEqual(EMPTY_CULTURE_PROGRESS);
    expect(
      sanitizeCultureProgress({
        read: { 'culture-bowing': TODAY, 'culture-x': 'yesterday', '': TODAY },
        results: { 'culture-topic-food': { correct: 9, total: 4, date: TODAY }, bad: 1 },
      }),
    ).toEqual({
      read: { 'culture-bowing': TODAY },
      results: { 'culture-topic-food': { correct: 4, total: 4, date: TODAY } },
    });
  });

  it('marks cards read and unread, and counts them per topic', () => {
    const topic = CULTURE_TOPICS[1]!;
    const [a, b] = cardsInTopic(topic.id);
    let progress = setRead(EMPTY_CULTURE_PROGRESS, a!.id, true, TODAY);
    progress = setRead(progress, b!.id, true, TODAY);
    progress = setRead(progress, a!.id, false, TODAY);
    expect(progress.read).toEqual({ [b!.id]: TODAY });
    expect(topicProgress(topic.id, progress)).toEqual({
      read: 1,
      total: cardsInTopic(topic.id).length,
    });
  });
});
