/**
 * Typed access to the Korea apps guide: apps, arrival checklists, "How do I…" answers and
 * the glossary of words seen in Korean apps.
 *
 * Every fact about access (Korean number, ARC, foreign cards) was checked by web search
 * and carries `lastVerified`. Ids must never change: checklist ticks are saved by item id.
 */
import appsJson from './apps.json';
import checklistsJson from './checklists.json';
import glossaryJson from './glossary.json';
import howtoJson from './howto.json';

/** In display order. Keep in sync with APP_ENUMS in scripts/validate-content.ts. */
export const APP_CATEGORIES = [
  'maps',
  'translation',
  'messaging',
  'transport',
  'food',
  'shopping',
  'money',
  'student',
  'travel',
  'safety',
] as const;
export type AppCategory = (typeof APP_CATEGORIES)[number];

export const CATEGORY_TITLE: Record<AppCategory, string> = {
  maps: 'Maps and navigation',
  translation: 'Translation and dictionary',
  messaging: 'Messaging',
  transport: 'Transport',
  food: 'Food delivery and restaurants',
  shopping: 'Shopping and second-hand',
  money: 'Money and payments',
  student: 'Student life',
  travel: 'Travel and city info',
  safety: 'Safety and health',
};

/** Has an English interface? */
export const ENGLISH_VALUES = ['yes', 'partial', 'no', 'unconfirmed'] as const;
export type EnglishSupport = (typeof ENGLISH_VALUES)[number];

/** Is a Korean phone number / an ARC needed? `some` = only for some features. */
export const NEED_VALUES = ['no', 'some', 'yes', 'unconfirmed'] as const;
export type Need = (typeof NEED_VALUES)[number];

/** Do foreign-issued cards work? `none` = the app takes no payments. */
export const CARD_VALUES = ['yes', 'some', 'no', 'none', 'unconfirmed'] as const;
export type CardSupport = (typeof CARD_VALUES)[number];

/** When it can be set up: before flying, after arriving (Korean number), after the ARC. */
export const SETUP_VALUES = ['before', 'arrival', 'arc'] as const;
export type SetupWhen = (typeof SETUP_VALUES)[number];

export interface Source {
  name: string;
  url: string;
}

export interface KoreaApp {
  /** `app-<slug>` */
  id: string;
  name: string;
  /** Korean name, when the app has one. */
  korean?: string;
  category: AppCategory;
  /** What it does. */
  what: string;
  /** Why locals use it instead of the global alternative. */
  why: string;
  english: EnglishSupport;
  koreanNumber: Need;
  arc: Need;
  foreignCards: CardSupport;
  setup: SetupWhen;
  /** Details on access; says so when sources disagree. */
  access: string;
  /** True when sources disagree about access. */
  disputed?: boolean;
  /** Verified store links. A missing one is shown as a store search instead. */
  stores: { ios?: string; android?: string };
  web?: string;
  sources: Source[];
  lastVerified: string;
  /** Related items: other apps, library resources, culture cards. */
  refs?: string[];
}

export interface ChecklistItem {
  /** `check-<list>-<slug>`; saved ticks use it. */
  id: string;
  text: string;
  refs?: string[];
}

export interface Checklist {
  id: string;
  title: string;
  when: SetupWhen;
  intro: string;
  items: ChecklistItem[];
  lastVerified: string;
}

export interface HowTo {
  /** `howto-<slug>` */
  id: string;
  /** Completes "How do I…". */
  question: string;
  /** The short answer, one or two sentences. */
  answer: string;
  steps: string[];
  refs?: string[];
  sources?: Source[];
  lastVerified: string;
}

export const GLOSSARY_GROUPS = ['account', 'buttons', 'ordering', 'delivery', 'transport'] as const;
export type GlossaryGroup = (typeof GLOSSARY_GROUPS)[number];

export const GLOSSARY_GROUP_TITLE: Record<GlossaryGroup, string> = {
  account: 'Signing up and logging in',
  buttons: 'Buttons on every screen',
  ordering: 'Ordering and paying',
  delivery: 'Delivery',
  transport: 'Maps, taxis and transit',
};

export interface AppWord {
  /** `appword-<korean>` */
  id: string;
  /** As it appears on screen (확인); the deck word may be longer (확인하다). */
  korean: string;
  group: GlossaryGroup;
  /** Id of the vocabulary word it links to. */
  word: string;
}

/** In category order, then file order. */
export const KOREA_APPS: KoreaApp[] = (appsJson as KoreaApp[])
  .map((app, i) => ({ app, i }))
  .sort(
    (a, b) =>
      APP_CATEGORIES.indexOf(a.app.category) - APP_CATEGORIES.indexOf(b.app.category) || a.i - b.i,
  )
  .map(({ app }) => app);

export const CHECKLISTS = checklistsJson as Checklist[];
export const HOW_TOS = howtoJson as HowTo[];
export const APP_WORDS = glossaryJson as AppWord[];

export const findApp = (id: string | undefined) => KOREA_APPS.find((a) => a.id === id);
export const findHowTo = (id: string | undefined) => HOW_TOS.find((h) => h.id === id);
export const appsIn = (category: AppCategory) => KOREA_APPS.filter((a) => a.category === category);

/** All checklist item ids, for sanitizing saved ticks. */
export const CHECKLIST_ITEM_IDS = new Set(CHECKLISTS.flatMap((c) => c.items.map((i) => i.id)));
