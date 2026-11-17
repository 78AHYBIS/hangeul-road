import { describe, expect, it } from 'vitest';
import { GRAMMAR_LESSONS } from '../../content/grammar';
import {
  buildItem,
  buildPractice,
  correctSentence,
  fillGap,
  isChoice,
  isTilesCorrect,
} from './practice';

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/** Polite endings: 해요 style (…요) or 합니다 style (…니다 / …니까). */
const POLITE = /(요|니다|니까)[.?!]$/;

describe('grammar content', () => {
  it('has at least 15 lessons with unique ids, in the spec order', () => {
    expect(GRAMMAR_LESSONS.length).toBeGreaterThanOrEqual(15);
    expect(new Set(GRAMMAR_LESSONS.map((l) => l.id)).size).toBe(GRAMMAR_LESSONS.length);
    const titles = GRAMMAR_LESSONS.map((l) => l.title).join(' | ');
    for (const topic of [
      '이에요',
      '은 / 는',
      '이 / 가',
      '을 / 를',
      '에 / 에서',
      '아요 / 어요',
      '안 / 못',
      'Past',
      'Future',
      '고 싶어요',
      '주세요',
      'questions',
      '있어요',
      'but',
      '합니다',
    ]) {
      expect(titles, topic).toContain(topic);
    }
  });

  it('gives every lesson 4 to 6 polite examples and at least 6 practice items', () => {
    for (const lesson of GRAMMAR_LESSONS) {
      expect(lesson.examples.length, lesson.id).toBeGreaterThanOrEqual(4);
      expect(lesson.examples.length, lesson.id).toBeLessThanOrEqual(6);
      expect(lesson.practice.length, lesson.id).toBeGreaterThanOrEqual(6);
      for (const example of lesson.examples) expect(example.korean, lesson.id).toMatch(POLITE);
    }
  });

  it('uses all four practice types', () => {
    const types = new Set(GRAMMAR_LESSONS.flatMap((l) => l.practice.map((p) => p.type)));
    expect([...types].sort()).toEqual(['blank', 'order', 'particle', 'translate']);
  });

  it('has practice answers that make polite sentences', () => {
    for (const lesson of GRAMMAR_LESSONS) {
      for (const practice of lesson.practice) {
        expect(correctSentence(practice), lesson.id).toMatch(POLITE);
        if (isChoice(practice)) {
          // Only the right option may give the sentence; a gap is never left over.
          expect(correctSentence(practice)).not.toContain('___');
        }
      }
    }
  });
});

describe('practice sessions', () => {
  const lesson = GRAMMAR_LESSONS[0]!;

  it('keeps every item and every option or tile', () => {
    const items = buildPractice(lesson, seeded(1));
    expect(items).toHaveLength(lesson.practice.length);
    items.forEach((item, i) => {
      const p = lesson.practice[i]!;
      if (item.kind === 'choice' && isChoice(p)) {
        expect([...item.options].sort()).toEqual([...p.options].sort());
      } else if (item.kind === 'tiles' && !isChoice(p)) {
        const expected = p.type === 'translate' ? [...p.tiles, ...p.distractors] : p.tiles;
        expect(item.pool.map((t) => t.text).sort()).toEqual([...expected].sort());
        expect(new Set(item.pool.map((t) => t.key)).size).toBe(item.pool.length);
      }
    });
  });

  it('never shows the tiles already in the right order', () => {
    for (const l of GRAMMAR_LESSONS) {
      for (const p of l.practice) {
        if (isChoice(p)) continue;
        for (let seed = 0; seed < 30; seed++) {
          const item = buildItem(p, seeded(seed));
          if (item.kind !== 'tiles') throw new Error('expected tiles');
          const start = item.pool.slice(0, p.tiles.length).map((t) => t.text);
          expect(start, l.id).not.toEqual(p.tiles);
        }
      }
    }
  });

  it('checks tile answers, including accepted word orders', () => {
    const p = lesson.practice.find((x) => x.type === 'order' && x.accept)!;
    if (isChoice(p)) throw new Error('expected an order item');
    expect(isTilesCorrect(p, p.tiles)).toBe(true);
    expect(isTilesCorrect(p, ['도서관에서', '오늘', '공부해요.'])).toBe(true);
    expect(isTilesCorrect(p, ['공부해요.', '오늘', '도서관에서'])).toBe(false);
    expect(isTilesCorrect(p, p.tiles.slice(1))).toBe(false);
  });

  it('fills the gap', () => {
    expect(fillGap('저___ 학생이에요.', '는')).toBe('저는 학생이에요.');
  });
});
