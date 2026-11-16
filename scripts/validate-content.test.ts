import { describe, expect, it } from 'vitest';
import { validateContent } from './validate-content';

const file = (json: unknown, path = 'vocab/test.json') => ({ path, json });

describe('validateContent', () => {
  it('accepts valid items and no files at all', () => {
    expect(validateContent([]).errors).toEqual([]);
    const result = validateContent([
      file([
        { id: 'a', korean: '안녕하세요' },
        { id: 'b', korean: '감사합니다', refs: ['a'], lastVerified: '2026-11-16' },
      ]),
    ]);
    expect(result.errors).toEqual([]);
    expect(result.itemCount).toBe(2);
  });

  it('reports missing and duplicate ids across files', () => {
    const { errors } = validateContent([
      file([{ id: 'a' }, { korean: '물' }]),
      file([{ id: 'a' }], 'grammar/x.json'),
    ]);
    expect(errors).toHaveLength(2);
    expect(errors.join('\n')).toMatch(/missing "id"/);
    expect(errors.join('\n')).toMatch(/duplicate id "a"/);
  });

  it('reports empty or non-Hangul Korean text', () => {
    const { errors } = validateContent([
      file([
        { id: 'a', korean: ' ' },
        { id: 'b', korean: 'annyeong' },
      ]),
    ]);
    expect(errors).toHaveLength(2);
  });

  it('reports broken references, bad dates and non-array files', () => {
    const { errors } = validateContent([
      file([{ id: 'a', refs: ['ghost'], lastVerified: 'yesterday' }]),
      file({ id: 'x' }, 'culture/y.json'),
    ]);
    expect(errors).toHaveLength(3);
  });

  it('lists needsReview items without failing', () => {
    const result = validateContent([file([{ id: 'a', korean: '물', needsReview: true }])]);
    expect(result.errors).toEqual([]);
    expect(result.needsReview).toHaveLength(1);
  });
});
