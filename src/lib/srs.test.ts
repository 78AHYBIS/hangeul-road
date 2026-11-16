import { describe, expect, it } from 'vitest';
import { LIMITS, buildQueue, review, sanitizeCard, stageOf, type Card, type Grade } from './srs';

const DAY1 = '2026-11-16';
const answer = (grades: Grade[], start: Card | undefined = undefined) => {
  let card = start;
  let today = DAY1;
  for (const grade of grades) {
    card = review(card, grade, today);
    today = card.due; // answer again exactly when due
  }
  return card!;
};

describe('review: scheduling', () => {
  it('keeps a new card for today on Again', () => {
    const card = review(undefined, 'again', DAY1);
    expect(card).toMatchObject({ state: 'learning', due: DAY1, interval: 0, reps: 1 });
    expect(card.introduced).toBe(DAY1);
    expect(stageOf(card)).toBe('learning');
  });

  it('graduates a new card on Good and Easy', () => {
    expect(review(undefined, 'good', DAY1)).toMatchObject({
      state: 'review',
      interval: 1,
      due: '2026-11-17',
    });
    expect(review(undefined, 'easy', DAY1)).toMatchObject({ state: 'review', interval: 4 });
  });

  it('shows a Hard new card tomorrow, still learning, then graduates to 3 days', () => {
    const hard = review(undefined, 'hard', DAY1);
    expect(hard).toMatchObject({ state: 'learning', interval: 1, due: '2026-11-17' });
    expect(review(hard, 'good', hard.due)).toMatchObject({ state: 'review', interval: 3 });
  });

  it('grows intervals with Good: 1, 3, 8, 20, 50', () => {
    expect(answer(['good', 'good']).interval).toBe(3);
    expect(answer(['good', 'good', 'good']).interval).toBe(8);
    expect(answer(['good', 'good', 'good', 'good']).interval).toBe(20);
    expect(answer(['good', 'good', 'good', 'good', 'good']).interval).toBe(50);
  });

  it('orders the answers: hard < good < easy', () => {
    const base = answer(['good', 'good', 'good']); // interval 8
    const next = (g: Grade) => review(base, g, base.due);
    expect(next('hard').interval).toBeLessThan(next('good').interval);
    expect(next('good').interval).toBeLessThan(next('easy').interval);
    expect(next('hard').interval).toBeGreaterThan(base.interval);
    expect(next('hard').ease).toBe(2.35);
    expect(next('easy').ease).toBe(2.65);
  });

  it('becomes mature at 21 days and never exceeds a year', () => {
    expect(stageOf(answer(['good', 'good', 'good', 'good']))).toBe('review'); // 20 days
    expect(stageOf(answer(['good', 'good', 'good', 'good', 'good']))).toBe('mature');
    expect(answer(Array<Grade>(12).fill('easy')).interval).toBe(365);
  });
});

describe('review: lapses', () => {
  const learned = answer(['good', 'good', 'good', 'good']); // interval 20, ease 2.5

  it('sends a forgotten card back to learning today', () => {
    const lapsed = review(learned, 'again', learned.due);
    expect(lapsed).toMatchObject({ state: 'learning', interval: 0, lapses: 1, ease: 2.3 });
    expect(lapsed.due).toBe(learned.due);
    expect(lapsed.introduced).toBe(DAY1);
  });

  it('restarts from 1 day after a lapse, with slower growth', () => {
    const lapsed = review(learned, 'again', learned.due);
    const back = review(lapsed, 'good', lapsed.due);
    expect(back).toMatchObject({ state: 'review', interval: 1 });
    expect(review(back, 'good', back.due).interval).toBe(2); // 1 * 2.3
  });

  it('never drops ease below 1.3', () => {
    let card = learned;
    for (let i = 0; i < 20; i++) {
      card = review(card, 'again', card.due);
      card = review(card, 'good', card.due);
    }
    expect(card.ease).toBe(1.3);
    expect(card.lapses).toBe(20);
  });
});

describe('buildQueue', () => {
  const ids = Array.from({ length: 400 }, (_, i) => `w${String(i).padStart(3, '0')}`);
  const dueCard = (due: string, introduced = '2026-10-01'): Card => ({
    state: 'review',
    due,
    interval: 5,
    ease: 2.5,
    reps: 3,
    lapses: 0,
    introduced,
  });

  it('gives only new words on day one, in order, up to the daily goal', () => {
    expect(buildQueue({}, ids, DAY1, LIMITS.minimum).newCards).toEqual(ids.slice(0, 5));
    expect(buildQueue({}, ids, DAY1, LIMITS.normal).newCards).toHaveLength(10);
    expect(buildQueue({}, ids, DAY1, LIMITS.intense).newCards).toHaveLength(15);
  });

  it('counts words already introduced today against the limit', () => {
    const cards = Object.fromEntries(
      ids.slice(0, 7).map((id) => [id, dueCard('2026-11-17', DAY1)]),
    );
    const queue = buildQueue(cards, ids, DAY1, LIMITS.normal);
    expect(queue.newCards).toEqual(ids.slice(7, 10));
    expect(queue.reviews).toEqual([]);
  });

  it('includes cards due today or earlier, most overdue first, and skips future ones', () => {
    const cards = {
      w000: dueCard('2026-11-16'),
      w001: dueCard('2026-11-10'),
      w002: dueCard('2026-11-17'),
    };
    const queue = buildQueue(cards, ids, DAY1, LIMITS.normal);
    expect(queue.reviews).toEqual(['w001', 'w000']);
    expect(queue.dueTotal).toBe(2);
  });

  it('caps reviews after a missed week: no wall of 300 cards, and no new words on top', () => {
    const cards = Object.fromEntries(ids.slice(0, 300).map((id) => [id, dueCard('2026-11-09')]));
    const queue = buildQueue(cards, ids, DAY1, LIMITS.normal);
    expect(queue.reviews).toHaveLength(50);
    expect(queue.dueTotal).toBe(300);
    expect(queue.newCards).toEqual([]);
    expect(buildQueue(cards, ids, DAY1, LIMITS.minimum).reviews).toHaveLength(20);
  });

  it('brings new words back once the backlog fits under the cap', () => {
    const cards = Object.fromEntries(ids.slice(0, 50).map((id) => [id, dueCard('2026-11-09')]));
    const queue = buildQueue(cards, ids, DAY1, LIMITS.normal);
    expect(queue.reviews).toHaveLength(50);
    expect(queue.newCards).toHaveLength(10);
  });

  it('ignores cards for words that no longer exist', () => {
    const queue = buildQueue({ deleted: dueCard('2026-11-01') }, ids, DAY1, LIMITS.normal);
    expect(queue.reviews).toEqual([]);
  });
});

describe('sanitizeCard', () => {
  it('rejects junk and repairs out-of-range values', () => {
    expect(sanitizeCard(null)).toBeNull();
    expect(sanitizeCard({ due: 'soon' })).toBeNull();
    expect(sanitizeCard({ due: DAY1, state: 'weird', ease: 0.1, interval: 9999 })).toEqual({
      state: 'learning',
      due: DAY1,
      interval: 365,
      ease: 1.3,
      reps: 0,
      lapses: 0,
      introduced: DAY1,
    });
  });
});
