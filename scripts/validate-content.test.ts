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

  it('checks required fields and example sentences for known files', () => {
    const { errors } = validateContent([
      file([{ id: 'w1', korean: '물', meaning: '' }], 'src/content/hangul/reading-words.json'),
      file(
        [{ id: 'r1', title: 't', summary: 's', explanation: ['e'], examples: [{ korean: 'x' }] }],
        'src/content/hangul/rules.json',
      ),
    ]);
    // w1: meaning, romanization, category missing; r1: one bad example.
    expect(errors).toHaveLength(4);
  });

  it('checks vocabulary words: fields, Korean example and deck reference', () => {
    const word = { id: 'v1', korean: '물', meaning: 'water', pos: 'noun', exampleMeaning: 'x' };
    const { errors } = validateContent([
      file([{ id: 'deck-a', title: 't', description: 'd' }], 'src/content/vocab/decks.json'),
      file(
        [
          { ...word, deck: 'deck-a', example: '물 주세요.' },
          { ...word, id: 'v2', deck: 'deck-missing', example: 'water please' },
        ],
        'src/content/vocab/deck-01-a.json',
      ),
    ]);
    expect(errors).toHaveLength(2);
    expect(errors.join()).toMatch(/no Hangul/);
    expect(errors.join()).toMatch(/broken reference "deck-missing"/);
  });

  it('checks resources: allowed values, https links, dates and path references', () => {
    const good = {
      id: 'res-a',
      name: 'A',
      type: 'course',
      url: 'https://example.com',
      description: 'd',
      why: 'w',
      skills: ['grammar'],
      level: 'beginner',
      cost: 'free',
      lastVerified: '2026-11-17',
    };
    const { lastVerified: _date, ...unverified } = good;
    void _date;
    const { errors } = validateContent([
      file(
        [
          good,
          { ...good, id: 'res-b', type: 'blog', skills: ['cooking'], url: 'http://x.com' },
          { ...unverified, id: 'res-c' },
        ],
        'src/content/resources/resources.json',
      ),
      file(
        [
          { id: 'path-1', stage: 'hangul', title: 't', text: 'x', refs: ['res-a'] },
          { id: 'path-2', stage: 'later', title: 't', text: 'x', refs: ['res-ghost'] },
        ],
        'src/content/resources/path.json',
      ),
    ]);
    // res-b: type, skill, url; res-c: lastVerified; path-2: stage, broken ref.
    expect(errors).toHaveLength(6);
  });

  it('checks culture cards and topic quizzes', () => {
    const topic = {
      id: 'culture-topic-x',
      title: 't',
      korean: '예절',
      intro: 'i',
      quiz: [1, 2, 3].map(() => ({ question: 'q', options: ['a', 'b'], answer: 'a', why: 'w' })),
    };
    const card = {
      id: 'culture-a',
      topic: 'culture-topic-x',
      title: 't',
      summary: 's',
      body: ['b'],
      do: ['d'],
      avoid: ['a'],
      words: [{ korean: '나이', meaning: 'age' }],
    };
    const topics = (items: unknown[]) => file(items, 'src/content/culture/topics.json');
    const cards = (items: unknown[]) => file(items, 'src/content/culture/cards.json');
    expect(validateContent([topics([topic]), cards([card])]).errors).toEqual([]);

    const { errors } = validateContent([
      topics([
        topic,
        {
          ...topic,
          id: 'culture-topic-ulsan',
          quiz: [{ question: 'q', options: ['a'], answer: 'z' }],
        },
      ]),
      cards([
        { ...card, id: 'culture-b', topic: 'culture-topic-ghost' },
        { ...card, id: 'culture-c', words: [{ korean: 'age', meaning: '' }] },
        { ...card, id: 'culture-d', body: ['Call 119.'] },
        { ...card, id: 'culture-e', sources: [{ name: 'x', url: 'http://x.com' }] },
        { ...card, id: 'culture-f', topic: 'culture-topic-ulsan', lastVerified: '2026-11-17' },
      ]),
    ]);
    const text = errors.join('\n');
    expect(text).toMatch(/quiz of at least 3/);
    expect(text).toMatch(/missing "why"/);
    expect(text).toMatch(/at least 2 different "options"/);
    expect(text).toMatch(/broken reference "culture-topic-ghost"/);
    expect(text).toMatch(/words\[0\]: "korean" has no Hangul/);
    expect(text).toMatch(/words\[0\]: missing "meaning"/);
    expect(text).toMatch(/culture-d|cards\.json\[2\]: cites sources/);
    expect(text).toMatch(/"url" must start with https/);
    expect(text).toMatch(/must cite an official source/);
    expect(errors).toHaveLength(10);
  });

  it('checks Korea apps, checklists, how-to answers and app words', () => {
    const app = {
      id: 'app-a',
      name: 'A',
      category: 'maps',
      what: 'w',
      why: 'y',
      english: 'yes',
      koreanNumber: 'no',
      arc: 'unconfirmed',
      foreignCards: 'none',
      setup: 'before',
      access: 'a',
      stores: { ios: 'https://apps.apple.com/app/id123' },
      sources: [{ name: 's', url: 'https://example.com' }],
      lastVerified: '2026-11-22',
    };
    const apps = (json: unknown[]) => file(json, 'src/content/korea-apps/apps.json');
    expect(validateContent([apps([app])]).errors).toEqual([]);

    const { errors } = validateContent([
      apps([
        app,
        { ...app, id: 'app-b', english: 'maybe', stores: { ios: 'https://example.com/app' } },
        { ...app, id: 'app-c', stores: {}, sources: [], lastVerified: undefined },
        {
          ...app,
          id: 'app-d',
          stores: { android: 'https://play.google.com/store/apps/details?id=a.b' },
        },
      ]),
      file(
        [
          {
            id: 'checklist-x',
            title: 't',
            when: 'someday',
            intro: 'i',
            lastVerified: '2026-11-22',
            items: [
              { id: 'check-1', text: 't', refs: ['app-a'] },
              { id: 'check-1', text: '', refs: ['app-ghost'] },
            ],
          },
        ],
        'src/content/korea-apps/checklists.json',
      ),
      file(
        [{ id: 'howto-x', question: 'q', answer: 'a', steps: ['one'], lastVerified: '2026-11-22' }],
        'src/content/korea-apps/howto.json',
      ),
      file(
        [{ id: 'appword-x', korean: '검색', group: 'misc', word: 'vocab-ghost' }],
        'src/content/korea-apps/glossary.json',
      ),
    ]);
    const text = errors.join('\n');
    expect(text).toMatch(/unknown english "maybe"/);
    expect(text).toMatch(/"ios" link is not a store link/);
    expect(text).toMatch(/needs at least one store link/);
    expect(text).toMatch(/"sources" must be a non-empty list/);
    expect(text).toMatch(/missing "lastVerified"/);
    expect(text).toMatch(/unknown when "someday"/);
    expect(text).toMatch(/duplicate id "check-1"/);
    expect(text).toMatch(/items\[1\]: missing "text"/);
    expect(text).toMatch(/broken reference "app-ghost"/);
    expect(text).toMatch(/at least 2 steps/);
    expect(text).toMatch(/unknown group "misc"/);
    expect(text).toMatch(/broken reference "vocab-ghost"/);
  });
});
