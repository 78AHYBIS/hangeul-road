import { describe, expect, it } from 'vitest';
import { PATH, RESOURCES } from '../../content/resources';
import { EMPTY_LIBRARY, addCustom, setStatus, toggleActive } from '../../lib/libraryProgress';
import {
  NO_FILTERS,
  allResources,
  filterResources,
  findResource,
  splitStartHere,
} from './resources';

const ids = (list: { id: string }[]) => list.map((r) => r.id);

describe('library content', () => {
  it('has at least 30 verified resources with https links', () => {
    expect(RESOURCES.length).toBeGreaterThanOrEqual(30);
    for (const r of RESOURCES) {
      expect(r.url, r.id).toMatch(/^https:\/\//);
      expect(r.lastVerified, r.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('covers every seed group from the spec', () => {
    const all = ids(RESOURCES);
    for (const id of [
      'res-ttmik',
      'res-howtostudykorean',
      'res-king-sejong',
      'res-coursera-first-step',
      'res-gobilly',
      'res-korean-unnie',
      'res-seemile',
      'res-naver-dict',
      'res-papago',
      'res-anki',
      'res-forvo',
      'res-italki',
      'res-hellotalk',
      'res-tandem',
      'res-topik',
      'res-unist-inbound',
      'res-visitkorea',
    ]) {
      expect(all).toContain(id);
    }
    expect(RESOURCES.filter((r) => r.url.includes('udemy.com')).length).toBeGreaterThanOrEqual(2);
  });

  it('marks every paid Udemy course with an honest note', () => {
    for (const r of RESOURCES.filter((x) => x.url.includes('udemy.com'))) {
      expect(r.cost).toBe('paid');
      expect(r.note).toMatch(/free/i);
    }
  });

  it('has one recommended-path step per roadmap stage', () => {
    expect(PATH.map((s) => s.stage)).toEqual(['hangul', 'core', 'survival', 'arrival', 'in-korea']);
  });
});

describe('filterResources', () => {
  const items = allResources(EMPTY_LIBRARY);

  it('returns everything with no filters', () => {
    expect(filterResources(items, NO_FILTERS, EMPTY_LIBRARY)).toHaveLength(items.length);
  });

  it('filters by type, skill and cost', () => {
    const youtube = filterResources(items, { ...NO_FILTERS, type: 'youtube' }, EMPTY_LIBRARY);
    expect(youtube.length).toBeGreaterThan(0);
    expect(youtube.every((r) => r.type === 'youtube')).toBe(true);

    const topik = filterResources(items, { ...NO_FILTERS, skill: 'topik' }, EMPTY_LIBRARY);
    expect(ids(topik)).toContain('res-topik');

    // "Free" includes free-with-paid-extras, but not paid.
    const free = filterResources(items, { ...NO_FILTERS, cost: 'free' }, EMPTY_LIBRARY);
    expect(free.some((r) => r.cost === 'freemium')).toBe(true);
    expect(free.some((r) => r.cost === 'paid')).toBe(false);
  });

  it('beginner level includes all-level resources', () => {
    const beginner = filterResources(items, { ...NO_FILTERS, level: 'beginner' }, EMPTY_LIBRARY);
    expect(beginner).toHaveLength(items.length);
    const allLevels = filterResources(items, { ...NO_FILTERS, level: 'all' }, EMPTY_LIBRARY);
    expect(allLevels.every((r) => r.level === 'all')).toBe(true);
  });

  it('searches name, description and notes, every word must match', () => {
    expect(ids(filterResources(items, { ...NO_FILTERS, query: 'papago' }, EMPTY_LIBRARY))).toEqual([
      'res-papago',
    ]);
    expect(
      filterResources(items, { ...NO_FILTERS, query: 'papago zzzz' }, EMPTY_LIBRARY),
    ).toHaveLength(0);
  });

  it('filters by my status', () => {
    const lib = setStatus(EMPTY_LIBRARY, 'res-anki', 'dropped');
    const dropped = filterResources(items, { ...NO_FILTERS, status: 'dropped' }, lib);
    expect(ids(dropped)).toEqual(['res-anki']);
  });

  it('finds user-added resources as unverified items', () => {
    const lib = {
      ...EMPTY_LIBRARY,
      custom: [
        {
          id: 'custom-1',
          name: 'Class notes',
          type: 'book' as const,
          url: '',
          description: '',
          skills: [],
          cost: 'free' as const,
        },
      ],
    };
    expect(findResource(lib, 'custom-1')).toMatchObject({ name: 'Class notes', custom: true });
    expect(allResources(lib)).toHaveLength(RESOURCES.length + 1);
  });
});

describe('Start here', () => {
  it('shows the six core resources by default and keeps the rest under More', () => {
    const { startHere, more } = splitStartHere(allResources(EMPTY_LIBRARY), EMPTY_LIBRARY);
    expect(ids(startHere)).toEqual([
      'res-howtostudykorean',
      'res-gobilly-youtube',
      'res-naver-dict',
      'res-papago',
      'res-hellotalk',
      'res-duolingo',
    ]);
    expect(startHere.length + more.length).toBe(RESOURCES.length);
  });

  it('keeps active courses (first), resources with a status and own resources visible', () => {
    let library = toggleActive(EMPTY_LIBRARY, 'res-ttmik-youtube');
    library = setStatus(library, 'res-anki', 'dropped');
    library = addCustom(library, {
      id: 'custom-1',
      name: 'My tutor',
      type: 'tutor',
      url: 'https://example.com',
      description: '',
      skills: [],
      cost: 'paid',
    });
    const { startHere, more } = splitStartHere(allResources(library), library);
    expect(startHere[0]?.id).toBe('res-ttmik-youtube');
    expect(ids(startHere)).toEqual(expect.arrayContaining(['res-anki', 'custom-1']));
    expect(ids(more)).not.toContain('res-anki');
  });
});
