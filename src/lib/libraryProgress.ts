/**
 * Saved resource-library progress: status and notes per resource, units of the
 * active courses, and resources the user added. Pure functions only; the store
 * saves the result.
 */
import {
  COSTS,
  RESOURCE_TYPES,
  SKILLS,
  type Cost,
  type ResourceType,
  type Skill,
} from '../content/resources';
import { isValidISODate, type ISODate } from './date';

export const STATUSES = ['not-started', 'in-progress', 'finished', 'dropped'] as const;
export type ResourceStatus = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<ResourceStatus, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  finished: 'Finished',
  dropped: 'Dropped',
};

/** At most this many active courses, so the plan stays focused. */
export const MAX_ACTIVE = 2;
export const MAX_UNITS = 300;
export const MAX_NOTES = 2000;

export interface Unit {
  /** Unique within its resource, e.g. 'u12'. */
  id: string;
  title: string;
  /** The day it was ticked off, or null. */
  doneOn: ISODate | null;
}

export interface ResourceState {
  status: ResourceStatus;
  notes: string;
  units: Unit[];
}

/** A resource the user added in the app (not verified like the built-in ones). */
export interface CustomResource {
  id: string;
  name: string;
  type: ResourceType;
  url: string;
  description: string;
  skills: Skill[];
  cost: Cost;
}

export interface LibraryProgress {
  /** Keyed by resource id. A resource with no entry is "not started". */
  items: Record<string, ResourceState>;
  /** Ids of the active courses, in the order they were made active. */
  active: string[];
  custom: CustomResource[];
}

export const EMPTY_LIBRARY: LibraryProgress = { items: {}, active: [], custom: [] };
export const EMPTY_STATE: ResourceState = { status: 'not-started', notes: '', units: [] };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Only http(s) links are kept, so a saved link can never run script. */
export function cleanUrl(value: unknown): string {
  const url = text(value, 500);
  return /^https?:\/\/\S+$/i.test(url) ? url : '';
}

function sanitizeUnits(raw: unknown): Unit[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const units: Unit[] = [];
  for (const u of raw) {
    if (!isRecord(u) || typeof u.id !== 'string' || !u.id || seen.has(u.id)) continue;
    const title = text(u.title, 200);
    if (!title) continue;
    seen.add(u.id);
    units.push({ id: u.id, title, doneOn: isValidISODate(u.doneOn) ? u.doneOn : null });
    if (units.length >= MAX_UNITS) break;
  }
  return units;
}

function sanitizeCustom(raw: unknown): CustomResource[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const list: CustomResource[] = [];
  for (const r of raw) {
    if (!isRecord(r) || typeof r.id !== 'string' || !r.id.startsWith('custom-')) continue;
    const name = text(r.name, 120);
    if (!name || seen.has(r.id)) continue;
    seen.add(r.id);
    list.push({
      id: r.id,
      name,
      type: RESOURCE_TYPES.includes(r.type as ResourceType) ? (r.type as ResourceType) : 'website',
      url: cleanUrl(r.url),
      description: text(r.description, 500),
      skills: Array.isArray(r.skills)
        ? [...new Set(r.skills.filter((s): s is Skill => SKILLS.includes(s as Skill)))]
        : [],
      cost: COSTS.includes(r.cost as Cost) ? (r.cost as Cost) : 'free',
    });
  }
  return list;
}

/** Turns anything (saved data, an imported file) into valid library progress. */
export function sanitizeLibrary(raw: unknown): LibraryProgress {
  if (!isRecord(raw)) return EMPTY_LIBRARY;
  const items: Record<string, ResourceState> = {};
  if (isRecord(raw.items)) {
    for (const [id, value] of Object.entries(raw.items)) {
      if (!id || !isRecord(value)) continue;
      items[id] = {
        status: STATUSES.includes(value.status as ResourceStatus)
          ? (value.status as ResourceStatus)
          : 'not-started',
        notes: text(value.notes, MAX_NOTES),
        units: sanitizeUnits(value.units),
      };
    }
  }
  const active = Array.isArray(raw.active)
    ? [...new Set(raw.active.filter((id): id is string => typeof id === 'string' && !!id))].slice(
        0,
        MAX_ACTIVE,
      )
    : [];
  return { items, active, custom: sanitizeCustom(raw.custom) };
}

export function stateOf(library: LibraryProgress, id: string): ResourceState {
  return library.items[id] ?? EMPTY_STATE;
}

function withState(
  library: LibraryProgress,
  id: string,
  change: (state: ResourceState) => ResourceState,
): LibraryProgress {
  return { ...library, items: { ...library.items, [id]: change(stateOf(library, id)) } };
}

export function setStatus(
  library: LibraryProgress,
  id: string,
  status: ResourceStatus,
): LibraryProgress {
  const next = withState(library, id, (s) => ({ ...s, status }));
  // A finished or dropped resource is no longer an active course.
  return status === 'finished' || status === 'dropped'
    ? { ...next, active: next.active.filter((a) => a !== id) }
    : next;
}

export function setNotes(library: LibraryProgress, id: string, notes: string): LibraryProgress {
  return withState(library, id, (s) => ({ ...s, notes: notes.slice(0, MAX_NOTES) }));
}

/**
 * Makes a resource active, or stops it being active. Returns the library unchanged
 * when two are already active. Making one active also marks it "in progress".
 */
export function toggleActive(library: LibraryProgress, id: string): LibraryProgress {
  if (library.active.includes(id)) {
    return { ...library, active: library.active.filter((a) => a !== id) };
  }
  if (library.active.length >= MAX_ACTIVE) return library;
  const next = withState(library, id, (s) => ({ ...s, status: 'in-progress' }));
  return { ...next, active: [...library.active, id] };
}

/** Adds units at the end. Blank titles are skipped; ids continue from the highest one. */
export function addUnits(library: LibraryProgress, id: string, titles: string[]): LibraryProgress {
  return withState(library, id, (s) => {
    let n = s.units.reduce((max, u) => Math.max(max, Number(u.id.slice(1)) || 0), 0);
    const added = titles
      .map((t) => t.trim().slice(0, 200))
      .filter(Boolean)
      .map((title) => ({ id: `u${++n}`, title, doneOn: null }));
    return { ...s, units: [...s.units, ...added].slice(0, MAX_UNITS) };
  });
}

/** "Lesson" and 3 give "Lesson 1", "Lesson 2", "Lesson 3", continuing after `from`. */
export function numberedTitles(prefix: string, count: number, from = 1): string[] {
  const name = prefix.trim() || 'Unit';
  const n = Math.max(0, Math.min(MAX_UNITS, Math.floor(count)));
  return Array.from({ length: n }, (_, i) => `${name} ${from + i}`);
}

export function toggleUnit(
  library: LibraryProgress,
  id: string,
  unitId: string,
  today: ISODate,
): LibraryProgress {
  return withState(library, id, (s) => ({
    ...s,
    units: s.units.map((u) => (u.id === unitId ? { ...u, doneOn: u.doneOn ? null : today } : u)),
  }));
}

export function removeUnit(library: LibraryProgress, id: string, unitId: string): LibraryProgress {
  return withState(library, id, (s) => ({ ...s, units: s.units.filter((u) => u.id !== unitId) }));
}

export function addCustom(library: LibraryProgress, resource: CustomResource): LibraryProgress {
  return sanitizeLibrary({ ...library, custom: [...library.custom, resource] });
}

export function removeCustom(library: LibraryProgress, id: string): LibraryProgress {
  const items = { ...library.items };
  delete items[id];
  return {
    items,
    active: library.active.filter((a) => a !== id),
    custom: library.custom.filter((r) => r.id !== id),
  };
}

/**
 * Today's unit: the first unit not yet done, or one ticked today. Keeping a unit
 * ticked today means the Today task stays put (and shows as done) for the rest of the day
 * instead of jumping to the next unit.
 */
export function unitForToday(state: ResourceState, today: ISODate): Unit | null {
  return state.units.find((u) => u.doneOn === null || u.doneOn === today) ?? null;
}

/** A course suggestion for the Today plan (the shape `ExtraTask` expects). */
export interface CourseTask {
  id: string;
  title: string;
  detail: string;
  to: string;
  done: boolean;
  unit?: { resourceId: string; unitId: string };
}

/**
 * Picks the external task for today from the active courses, or null to fall back
 * to Duolingo. With two active courses they take turns by day (`dayNumber`).
 * A course with no units yet still shows up, as a reminder to add them.
 */
export function courseTaskForToday(
  library: LibraryProgress,
  nameOf: (id: string) => string | undefined,
  today: ISODate,
  dayNumber: number,
): CourseTask | null {
  const options: CourseTask[] = [];
  for (const id of library.active) {
    const name = nameOf(id);
    if (!name) continue;
    const state = stateOf(library, id);
    const to = `/library/${encodeURIComponent(id)}`;
    if (state.units.length === 0) {
      options.push({
        id: `course:${id}`,
        title: `Continue ${name}`,
        detail: 'Add its lessons in the Library to tick them off here.',
        to,
        done: false,
      });
      continue;
    }
    const unit = unitForToday(state, today);
    if (!unit) continue; // every unit done before today
    const left = state.units.filter((u) => u.doneOn === null).length;
    options.push({
      id: `course:${id}:${unit.id}`,
      title: `${name}: ${unit.title}`,
      detail:
        left === 0 ? 'Last unit, done today.' : `${left} ${left === 1 ? 'unit' : 'units'} left.`,
      to,
      done: unit.doneOn === today,
      unit: { resourceId: id, unitId: unit.id },
    });
  }
  if (options.length === 0) return null;
  return options[((dayNumber % options.length) + options.length) % options.length]!;
}

/** The marker logged in today's tasksDone when a unit is ticked, so the streak counts it. */
export const unitMarker = (resourceId: string, unitId: string) => `unit:${resourceId}:${unitId}`;
