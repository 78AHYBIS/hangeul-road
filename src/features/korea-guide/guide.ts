/**
 * Korea guide logic: which checklist Today shows, checklist progress, links for `refs`,
 * and the app words with their vocabulary entries. Pure: dates and progress are passed in.
 */
import { findCard } from '../../content/culture';
import {
  APP_WORDS,
  CHECKLISTS,
  KOREA_APPS,
  findApp,
  findHowTo,
  type AppWord,
  type Checklist,
  type ChecklistItem,
  type KoreaApp,
} from '../../content/korea-apps';
import { RESOURCES } from '../../content/resources';
import { WORDS, type Word } from '../../content/vocab';
import type { ISODate } from '../../lib/date';
import type { KoreaGuideProgress } from '../../lib/koreaGuideProgress';

/** Today shows a checklist from this many days before departure. */
export const CHECKLIST_DAYS_BEFORE = 21;
/** …until this many days after arrival (the Residence Card deadline is 90 days). */
export const CHECKLIST_DAYS_AFTER = 90;

export interface ChecklistStatus {
  checklist: Checklist;
  done: number;
  total: number;
  /** Unticked items, in order. */
  open: ChecklistItem[];
}

export function checklistStatus(
  checklist: Checklist,
  progress: KoreaGuideProgress,
): ChecklistStatus {
  const open = checklist.items.filter((item) => !progress.checked[item.id]);
  return {
    checklist,
    done: checklist.items.length - open.length,
    total: checklist.items.length,
    open,
  };
}

/**
 * The checklist for the Today page, or null when none is due.
 * - more than 21 days before departure: none;
 * - in the last 21 days: "Before I fly", then (once it is done) a look at "First week";
 * - from departure day until 90 days after: "First week", then "After I get my ARC";
 * - when every list in the window is done, or later than that: none.
 */
export function checklistForToday(
  progress: KoreaGuideProgress,
  daysToDeparture: number,
  checklists: Checklist[] = CHECKLISTS,
): ChecklistStatus | null {
  let order: Checklist['when'][];
  if (daysToDeparture > CHECKLIST_DAYS_BEFORE) return null;
  if (daysToDeparture > 0) order = ['before', 'arrival'];
  else if (daysToDeparture > -CHECKLIST_DAYS_AFTER) order = ['arrival', 'arc'];
  else return null;
  for (const when of order) {
    const list = checklists.find((c) => c.when === when);
    if (!list) continue;
    const status = checklistStatus(list, progress);
    if (status.open.length > 0) return status;
  }
  return null;
}

/**
 * The items Today shows: every item ticked today (so a tick does not make it vanish)
 * plus the first `limit` unticked items, in checklist order.
 */
export function itemsForToday(
  checklist: Checklist,
  progress: KoreaGuideProgress,
  today: ISODate,
  limit: number,
): ChecklistItem[] {
  const open = new Set(
    checklist.items
      .filter((item) => !progress.checked[item.id])
      .slice(0, limit)
      .map((item) => item.id),
  );
  return checklist.items.filter((item) => open.has(item.id) || progress.checked[item.id] === today);
}

export interface RefLink {
  to: string;
  title: string;
  /** What kind of item it is, shown as a small label. */
  kind: string;
}

/**
 * Turns a content id from `refs` into an in-app link: an app, a how-to answer, a culture
 * card, a library resource or a vocabulary word. Unknown ids give null.
 */
export function refLink(id: string): RefLink | null {
  const app = findApp(id);
  if (app) return { to: `/korea/apps/${app.id}`, title: app.name, kind: 'App' };
  const howTo = findHowTo(id);
  if (howTo)
    return {
      to: `/korea/howto/${howTo.id}`,
      title: `How do I: ${howTo.question.toLowerCase()}`,
      kind: 'How do I',
    };
  const card = findCard(id);
  if (card) return { to: `/korea/card/${card.id}`, title: card.title, kind: 'Culture card' };
  const resource = RESOURCES.find((r) => r.id === id);
  if (resource) return { to: `/library/${resource.id}`, title: resource.name, kind: 'Library' };
  const word = WORDS.find((w) => w.id === id);
  if (word) return { to: `/learn/vocab/deck/${word.deck}`, title: word.korean, kind: 'Word' };
  return null;
}

export const refLinks = (ids: string[] | undefined): RefLink[] =>
  (ids ?? []).map(refLink).filter((l): l is RefLink => l !== null);

/** Google Play link: the verified one, or a store search when none was verified. */
export function androidLink(app: KoreaApp): { url: string; verified: boolean } {
  if (app.stores.android) return { url: app.stores.android, verified: true };
  return {
    url: `https://play.google.com/store/search?q=${encodeURIComponent(app.name)}&c=apps`,
    verified: false,
  };
}

/** Apps that point to this app in their `refs` or are pointed to by it. */
export function relatedApps(app: KoreaApp): KoreaApp[] {
  return KOREA_APPS.filter(
    (other) =>
      other.id !== app.id && (other.refs?.includes(app.id) || app.refs?.includes(other.id)),
  );
}

export interface AppWordEntry extends AppWord {
  /** The linked vocabulary word (meaning, example, deck). */
  vocab: Word;
}

/** The glossary with each entry's vocabulary word. Entries with a missing word are skipped. */
export function appWordEntries(words: AppWord[] = APP_WORDS): AppWordEntry[] {
  return words.flatMap((entry) => {
    const vocab = WORDS.find((w) => w.id === entry.word);
    return vocab ? [{ ...entry, vocab }] : [];
  });
}

/** Search apps by name, Korean name or description. */
export function searchApps(query: string, apps: KoreaApp[] = KOREA_APPS): KoreaApp[] {
  const q = query.trim().toLowerCase();
  if (!q) return apps;
  return apps.filter((app) =>
    [app.name, app.korean ?? '', app.what, app.why].some((text) => text.toLowerCase().includes(q)),
  );
}
