import { describe, expect, it } from 'vitest';
import { RESOURCES } from '../../content/resources';
import { buildIndex, groupResults, search } from './search';

const index = buildIndex({ resources: RESOURCES });

describe('global search', () => {
  it('returns nothing for an empty query', () => {
    expect(search(index, '   ')).toEqual([]);
  });

  it('finds a word by its Korean and by its meaning', () => {
    const byKorean = search(index, '커피');
    expect(byKorean[0]).toMatchObject({ kind: 'word', title: '커피' });
    const byMeaning = search(index, 'coffee');
    expect(byMeaning.some((r) => r.kind === 'word' && r.title === '커피')).toBe(true);
  });

  it('covers phrases, culture cards, resources, apps and how-to answers', () => {
    const kinds = (q: string) => new Set(search(index, q).map((r) => r.kind));
    expect(kinds('kakao').has('app')).toBe(true);
    expect(kinds('papago').has('resource')).toBe(true);
    expect(kinds('taxi').has('howto')).toBe(true);
    expect(kinds('recycling').has('culture')).toBe(true);
    expect(kinds('감사합니다').has('phrase')).toBe(true);
  });

  it('ranks a whole-name match above a mention in the text', () => {
    const results = search(index, 'naver map');
    expect(results[0]).toMatchObject({ kind: 'app', title: 'Naver Map' });
  });

  it('needs every word of the query to match', () => {
    expect(search(index, 'kakao zzzzqq')).toEqual([]);
  });

  it('includes resources added by the user', () => {
    const own = buildIndex({
      resources: [
        {
          id: 'custom-1',
          name: 'My tutor Mina',
          type: 'tutor',
          url: 'https://example.com',
          description: '',
          why: '',
          skills: [],
          level: 'all',
          cost: 'paid',
          lastVerified: '',
          custom: true,
        },
      ],
      words: [],
      phrases: [],
      grammar: [],
      culture: [],
      apps: [],
      howtos: [],
    });
    expect(search(own, 'mina')).toHaveLength(1);
  });

  it('groups results in display order', () => {
    const groups = groupResults(search(index, 'bus'));
    const kinds = groups.map(([kind]) => kind);
    expect(kinds.indexOf('word')).toBeLessThan(kinds.indexOf('app'));
    expect(groups.every(([, list]) => list.length > 0)).toBe(true);
  });
});
