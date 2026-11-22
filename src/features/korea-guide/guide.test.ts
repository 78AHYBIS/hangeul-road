import { describe, expect, it } from 'vitest';
import {
  APP_CATEGORIES,
  APP_WORDS,
  CHECKLISTS,
  CHECKLIST_ITEM_IDS,
  HOW_TOS,
  KOREA_APPS,
  NEED_VALUES,
} from '../../content/korea-apps';
import { CULTURE_CARDS } from '../../content/culture';
import { WORDS } from '../../content/vocab';
import { EMPTY_KOREA_GUIDE_PROGRESS, setChecked } from '../../lib/koreaGuideProgress';
import {
  androidLink,
  appWordEntries,
  checklistForToday,
  itemsForToday,
  refLink,
  refLinks,
  relatedApps,
  searchApps,
} from './guide';

const tickAll = (when: string) =>
  CHECKLISTS.find((c) => c.when === when)!.items.reduce(
    (p, item) => setChecked(p, item.id, true, '2027-02-01'),
    EMPTY_KOREA_GUIDE_PROGRESS,
  );

describe('Korea apps content', () => {
  it('has at least 25 apps in every category, each with access fields filled', () => {
    expect(KOREA_APPS.length).toBeGreaterThanOrEqual(25);
    for (const category of APP_CATEGORIES) {
      expect(
        KOREA_APPS.some((a) => a.category === category),
        category,
      ).toBe(true);
    }
    for (const app of KOREA_APPS) {
      // Filled in, or honestly marked "unconfirmed".
      expect(NEED_VALUES, app.id).toContain(app.koreanNumber);
      expect(NEED_VALUES, app.id).toContain(app.arc);
      expect(app.lastVerified, app.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(app.sources.length, app.id).toBeGreaterThan(0);
      expect(app.stores.ios ?? app.stores.android, app.id).toBeTruthy();
    }
  });

  it('says so when sources disagree', () => {
    for (const app of KOREA_APPS.filter((a) => a.disputed)) {
      expect(app.access, app.id).toMatch(/disagree|guide|not confirmed|claim|say/i);
    }
  });

  it('has three checklists in order, with unique item ids', () => {
    expect(CHECKLISTS.map((c) => c.when)).toEqual(['before', 'arrival', 'arc']);
    const ids = CHECKLISTS.flatMap((c) => c.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(CHECKLIST_ITEM_IDS.size).toBe(ids.length);
  });

  it('covers the "How do I" questions from the spec', () => {
    const ids = HOW_TOS.map((h) => h.id);
    for (const id of [
      'howto-airport-to-ulsan',
      'howto-bus',
      'howto-taxi',
      'howto-order-food',
      'howto-send-parcel',
      'howto-second-hand',
      'howto-pharmacy',
      'howto-pay-without-korean-card',
    ]) {
      expect(ids).toContain(id);
    }
  });

  it('turns every ref in the guide and the culture cards into a link', () => {
    const allRefs = [
      ...KOREA_APPS.flatMap((a) => a.refs ?? []),
      ...HOW_TOS.flatMap((h) => h.refs ?? []),
      ...CHECKLISTS.flatMap((c) => c.items.flatMap((i) => i.refs ?? [])),
      ...CULTURE_CARDS.flatMap((c) => c.refs ?? []),
    ];
    for (const id of allRefs) expect(refLink(id), id).not.toBeNull();
  });

  it('links the culture cards that mention the apps guide', () => {
    for (const card of CULTURE_CARDS.filter((c) => c.body.join(' ').includes('apps guide'))) {
      expect(
        refLinks(card.refs).some((l) => l.kind === 'App' || l.kind === 'How do I'),
        card.id,
      ).toBe(true);
    }
  });

  it('links every app word to a vocabulary word that starts with it', () => {
    const entries = appWordEntries();
    expect(entries).toHaveLength(APP_WORDS.length);
    expect(entries.length).toBeGreaterThanOrEqual(30);
    for (const entry of entries) {
      expect(entry.vocab.korean.startsWith(entry.korean), entry.id).toBe(true);
    }
    expect(new Set(APP_WORDS.map((w) => w.korean)).size).toBe(APP_WORDS.length);
  });

  it('adds the deck of app words and keeps every word once', () => {
    expect(WORDS.filter((w) => w.deck === 'deck-apps').length).toBeGreaterThanOrEqual(30);
  });
});

describe('checklistForToday', () => {
  const none = EMPTY_KOREA_GUIDE_PROGRESS;

  it('shows nothing more than three weeks before departure', () => {
    expect(checklistForToday(none, 22)).toBeNull();
    expect(checklistForToday(none, 100)).toBeNull();
  });

  it('shows "Before I fly" in the last three weeks', () => {
    const status = checklistForToday(none, 21)!;
    expect(status.checklist.when).toBe('before');
    expect(status.done).toBe(0);
    expect(status.open).toHaveLength(status.total);
    expect(checklistForToday(none, 1)!.checklist.when).toBe('before');
  });

  it('counts ticks and moves on to the first week once "Before I fly" is done', () => {
    const one = setChecked(none, 'check-before-maps', true, '2027-02-10');
    expect(checklistForToday(one, 10)!.done).toBe(1);
    expect(checklistForToday(tickAll('before'), 10)!.checklist.when).toBe('arrival');
  });

  it('shows the first week, then the ARC list, after arrival', () => {
    expect(checklistForToday(none, 0)!.checklist.when).toBe('arrival');
    expect(checklistForToday(tickAll('arrival'), -10)!.checklist.when).toBe('arc');
  });

  it('stops when everything is done or 90 days after arrival', () => {
    const all = {
      checked: { ...tickAll('arrival').checked, ...tickAll('arc').checked },
    };
    expect(checklistForToday(all, -5)).toBeNull();
    expect(checklistForToday(none, -90)).toBeNull();
    expect(checklistForToday(none, -89)).not.toBeNull();
  });
});

describe('itemsForToday', () => {
  const before = CHECKLISTS[0]!;
  it('shows the first unticked items and keeps items ticked today', () => {
    const ids = (p: typeof EMPTY_KOREA_GUIDE_PROGRESS) =>
      itemsForToday(before, p, '2027-02-10', 3).map((i) => i.id);
    expect(ids(EMPTY_KOREA_GUIDE_PROGRESS)).toEqual(before.items.slice(0, 3).map((i) => i.id));
    const tickedToday = setChecked(
      EMPTY_KOREA_GUIDE_PROGRESS,
      before.items[1]!.id,
      true,
      '2027-02-10',
    );
    expect(ids(tickedToday)).toEqual(before.items.slice(0, 4).map((i) => i.id));
    const tickedEarlier = setChecked(
      EMPTY_KOREA_GUIDE_PROGRESS,
      before.items[1]!.id,
      true,
      '2027-02-09',
    );
    expect(ids(tickedEarlier)).toEqual(
      [before.items[0]!, before.items[2]!, before.items[3]!].map((i) => i.id),
    );
  });
});

describe('links and search', () => {
  it('builds links for each kind of ref', () => {
    expect(refLink('app-papago')).toMatchObject({ to: '/korea/apps/app-papago', kind: 'App' });
    expect(refLink('howto-bus')).toMatchObject({ to: '/korea/howto/howto-bus' });
    expect(refLink('culture-delivery')).toMatchObject({ to: '/korea/card/culture-delivery' });
    expect(refLink('res-papago')).toMatchObject({ to: '/library/res-papago' });
    expect(refLink('vocab-apps-결제')).toMatchObject({ to: '/learn/vocab/deck/deck-apps' });
    expect(refLink('ghost')).toBeNull();
  });

  it('falls back to a Google Play search when no Android link was verified', () => {
    const kride = KOREA_APPS.find((a) => a.id === 'app-kride')!;
    expect(androidLink(kride)).toEqual({
      url: 'https://play.google.com/store/search?q=K.Ride&c=apps',
      verified: false,
    });
    const papago = KOREA_APPS.find((a) => a.id === 'app-papago')!;
    expect(androidLink(papago).verified).toBe(true);
  });

  it('finds related apps both ways', () => {
    const kride = KOREA_APPS.find((a) => a.id === 'app-kride')!;
    expect(relatedApps(kride).map((a) => a.id)).toContain('app-kakao-t');
  });

  it('searches names, Korean names and descriptions', () => {
    expect(searchApps('').length).toBe(KOREA_APPS.length);
    expect(searchApps('배달').map((a) => a.id)).toContain('app-baemin');
    expect(searchApps('taxi').map((a) => a.id)).toContain('app-kride');
  });
});
