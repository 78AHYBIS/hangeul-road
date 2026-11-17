/**
 * Typed access to the resource library. To add a resource, add an object to
 * resources.json (verify the link first and set `lastVerified`). Resource ids must
 * never change once released: saved status, notes and units are keyed by them.
 */
import type { StageId } from '../../lib/roadmap';
import pathJson from './path.json';
import resourcesJson from './resources.json';

export const RESOURCE_TYPES = [
  'course',
  'youtube',
  'website',
  'app',
  'podcast',
  'book',
  'dictionary',
  'tutor',
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const SKILLS = [
  'hangul',
  'vocabulary',
  'grammar',
  'listening',
  'speaking',
  'culture',
  'topik',
] as const;
export type Skill = (typeof SKILLS)[number];

export const LEVELS = ['beginner', 'beginner-intermediate', 'all'] as const;
export type Level = (typeof LEVELS)[number];

export const COSTS = ['free', 'freemium', 'paid'] as const;
export type Cost = (typeof COSTS)[number];

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  url: string;
  /** Short, honest description of what it is. */
  description: string;
  /** Why it is useful for this learner. */
  why: string;
  skills: Skill[];
  level: Level;
  cost: Cost;
  lastVerified: string;
  /** Not needed for the main goal (e.g. TOPIK). */
  optional?: boolean;
  /** Caveats: pricing changes, conflicting sources, honest comparisons. */
  note?: string;
}

/** One step of the recommended path, tied to a roadmap stage. */
export interface PathStep {
  id: string;
  stage: StageId;
  title: string;
  text: string;
  /** Resource ids, in the order to use them. */
  refs: string[];
}

export const RESOURCES = resourcesJson as Resource[];
export const PATH = pathJson as PathStep[];

export const TYPE_LABEL: Record<ResourceType, string> = {
  course: 'Course',
  youtube: 'YouTube',
  website: 'Website',
  app: 'App',
  podcast: 'Podcast',
  book: 'Book',
  dictionary: 'Dictionary',
  tutor: 'Tutor / exchange',
};

export const SKILL_LABEL: Record<Skill, string> = {
  hangul: 'Hangul',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  listening: 'Listening',
  speaking: 'Speaking',
  culture: 'Culture',
  topik: 'TOPIK',
};

export const LEVEL_LABEL: Record<Level, string> = {
  beginner: 'Beginner',
  'beginner-intermediate': 'Beginner to intermediate',
  all: 'All levels',
};

export const COST_LABEL: Record<Cost, string> = {
  free: 'Free',
  freemium: 'Free + paid extras',
  paid: 'Paid',
};
