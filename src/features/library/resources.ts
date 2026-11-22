/** Library helpers: one list of built-in and user-added resources, plus search and filters. */
import {
  RESOURCES,
  type Cost,
  type Level,
  type Resource,
  type ResourceType,
  type Skill,
} from '../../content/resources';
import {
  stateOf,
  type CustomResource,
  type LibraryProgress,
  type ResourceStatus,
} from '../../lib/libraryProgress';

/** A built-in resource, or one the user added (`custom: true`, never verified). */
export type LibraryItem = Resource & { custom?: boolean };

function fromCustom(r: CustomResource): LibraryItem {
  return {
    ...r,
    why: '',
    level: 'all',
    lastVerified: '',
    custom: true,
  };
}

export function allResources(library: LibraryProgress): LibraryItem[] {
  return [...RESOURCES, ...library.custom.map(fromCustom)];
}

export function findResource(library: LibraryProgress, id: string): LibraryItem | undefined {
  return (
    RESOURCES.find((r) => r.id === id) ?? library.custom.map(fromCustom).find((r) => r.id === id)
  );
}

export interface Filters {
  query: string;
  type: ResourceType | '';
  skill: Skill | '';
  level: Level | '';
  cost: Cost | '';
  status: ResourceStatus | '';
}

export const NO_FILTERS: Filters = {
  query: '',
  type: '',
  skill: '',
  level: '',
  cost: '',
  status: '',
};

/** "Beginner" matches resources for beginners, beginner-to-intermediate and all levels. */
function levelMatches(level: Level, wanted: Level): boolean {
  if (wanted === 'all') return level === 'all';
  if (wanted === 'beginner') return true;
  return level !== 'beginner';
}

/** Applies search text and filters. Free also counts "free + paid extras". */
export function filterResources(
  items: LibraryItem[],
  filters: Filters,
  library: LibraryProgress,
): LibraryItem[] {
  const words = filters.query.toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter((r) => {
    if (filters.type && r.type !== filters.type) return false;
    if (filters.skill && !r.skills.includes(filters.skill)) return false;
    if (filters.level && !levelMatches(r.level, filters.level)) return false;
    if (filters.cost === 'free' && r.cost === 'paid') return false;
    if (filters.cost && filters.cost !== 'free' && r.cost !== filters.cost) return false;
    if (filters.status && stateOf(library, r.id).status !== filters.status) return false;
    if (words.length === 0) return true;
    const haystack = [r.name, r.description, r.why, r.note ?? '', ...r.skills, r.type]
      .join(' ')
      .toLowerCase();
    return words.every((w) => haystack.includes(w));
  });
}

/**
 * The Library's default view: a short "Start here" list and the rest under "More
 * resources". Start here holds active courses, the `core` resources, anything with a
 * status (started, finished, dropped) and resources the user added.
 */
export function splitStartHere(
  items: LibraryItem[],
  library: LibraryProgress,
): { startHere: LibraryItem[]; more: LibraryItem[] } {
  const keep = (r: LibraryItem) =>
    library.active.includes(r.id) ||
    r.core === true ||
    r.custom === true ||
    stateOf(library, r.id).status !== 'not-started';
  const rank = (r: LibraryItem) => (library.active.includes(r.id) ? 0 : r.core ? 1 : 2);
  const startHere = items.filter(keep).sort((a, b) => rank(a) - rank(b));
  return { startHere, more: items.filter((r) => !keep(r)) };
}
