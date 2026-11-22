import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { chip, inputClass, muted } from '../../components/ui';
import {
  COSTS,
  COST_LABEL,
  LEVELS,
  LEVEL_LABEL,
  PATH,
  RESOURCE_TYPES,
  type PathStep,
  SKILLS,
  SKILL_LABEL,
  TYPE_LABEL,
} from '../../content/resources';
import { effectiveStartDate } from '../../lib/activity';
import { todayISO } from '../../lib/date';
import {
  STATUSES,
  STATUS_LABEL,
  stateOf,
  unitForToday,
  type LibraryProgress,
} from '../../lib/libraryProgress';
import { buildRoadmap, roadmapPosition } from '../../lib/roadmap';
import { useAppStore } from '../../lib/storage/store';
import {
  NO_FILTERS,
  allResources,
  filterResources,
  findResource,
  splitStartHere,
  type Filters,
  type LibraryItem,
} from './resources';

export function LibraryPage() {
  const library = useAppStore((s) => s.library);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const items = allResources(library);
  const shown = filterResources(items, filters, library);
  const filtering = Object.values(filters).some(Boolean);
  const { startHere, more } = splitStartHere(items, library);

  return (
    <Page searchable title="Library" subtitle="Outside courses, channels and tools in one place.">
      <ActiveCourses library={library} />
      <RecommendedPath library={library} />

      <section aria-labelledby="all-resources" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="all-resources" className="text-lg font-semibold">
            Resources
          </h2>
          <Link
            to="/library/add"
            className="flex min-h-10 items-center text-sm font-medium text-teal-700 dark:text-teal-400"
          >
            + Add your own
          </Link>
        </div>

        <Card>
          <label className="block text-sm font-medium">
            Search
            <input
              type="search"
              className={inputClass}
              placeholder="e.g. grammar, Papago, free"
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <FilterSelect
              label="Type"
              value={filters.type}
              options={RESOURCE_TYPES.map((t) => [t, TYPE_LABEL[t]])}
              onChange={(type) => setFilters({ ...filters, type })}
            />
            <FilterSelect
              label="Skill"
              value={filters.skill}
              options={SKILLS.map((s) => [s, SKILL_LABEL[s]])}
              onChange={(skill) => setFilters({ ...filters, skill })}
            />
            <FilterSelect
              label="Level"
              value={filters.level}
              options={LEVELS.map((l) => [l, LEVEL_LABEL[l]])}
              onChange={(level) => setFilters({ ...filters, level })}
            />
            <FilterSelect
              label="Cost"
              value={filters.cost}
              options={COSTS.map((c) => [c, c === 'free' ? 'Free to use' : COST_LABEL[c]])}
              onChange={(cost) => setFilters({ ...filters, cost })}
            />
            <FilterSelect
              label="My status"
              value={filters.status}
              options={STATUSES.map((s) => [s, STATUS_LABEL[s]])}
              onChange={(status) => setFilters({ ...filters, status })}
            />
            {filtering && (
              <button
                type="button"
                className="mt-6 min-h-10 rounded-lg text-sm font-medium text-teal-700 underline dark:text-teal-400"
                onClick={() => setFilters(NO_FILTERS)}
              >
                Clear all
              </button>
            )}
          </div>
        </Card>

        {filtering ? (
          <>
            <p className={muted} role="status" data-testid="resource-count">
              {shown.length} of {items.length} resources
            </p>
            <ResourceList items={shown} library={library} />
          </>
        ) : (
          <>
            <div>
              <h3 className="font-semibold">Start here</h3>
              <p className={muted}>
                A few good ones to begin with. Search or filter above to see all {items.length}.
              </p>
            </div>
            <ResourceList items={startHere} library={library} testId="start-here" />
            <details className="group" data-testid="more-resources">
              <summary className="flex min-h-11 cursor-pointer items-center justify-between rounded-xl border border-stone-200 bg-white px-4 font-medium dark:border-stone-800 dark:bg-stone-900">
                More resources ({more.length})
                <span
                  aria-hidden="true"
                  className="text-teal-700 transition-transform group-open:rotate-90 dark:text-teal-400"
                >
                  ›
                </span>
              </summary>
              <div className="mt-3">
                <ResourceList items={more} library={library} />
              </div>
            </details>
          </>
        )}
        {filtering && shown.length === 0 && (
          <p className={muted}>Nothing matches. Try fewer filters.</p>
        )}
      </section>
    </Page>
  );
}

function ResourceList({
  items,
  library,
  testId = 'resources',
}: {
  items: LibraryItem[];
  library: LibraryProgress;
  testId?: string;
}) {
  return (
    <ul className="space-y-3" data-testid={testId}>
      {items.map((r) => {
        const state = stateOf(library, r.id);
        return (
          <li key={r.id}>
            <Link to={`/library/${encodeURIComponent(r.id)}`} className="block">
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{r.name}</h3>
                  {library.active.includes(r.id) ? (
                    <span className="shrink-0 rounded-full bg-teal-700 px-2 py-0.5 text-xs text-white">
                      Active
                    </span>
                  ) : (
                    state.status !== 'not-started' && (
                      <span className={`shrink-0 ${chip}`}>{STATUS_LABEL[state.status]}</span>
                    )
                  )}
                </div>
                <p className={`mt-0.5 ${muted}`}>
                  {TYPE_LABEL[r.type]} · {COST_LABEL[r.cost]}
                  {r.custom ? ' · added by you' : ` · ${LEVEL_LABEL[r.level]}`}
                  {r.optional && ' · optional'}
                </p>
                {r.description && <p className="mt-1 line-clamp-2 text-sm">{r.description}</p>}
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | '';
  options: [T, string][];
  onChange: (value: T | '') => void;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <select
        className={`${inputClass} min-h-10 dark:bg-stone-900`}
        value={value}
        onChange={(e) => onChange(e.target.value as T | '')}
      >
        <option value="">Any</option>
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function ActiveCourses({ library }: { library: LibraryProgress }) {
  const today = todayISO();
  if (library.active.length === 0) {
    return (
      <Card>
        <h2 className="font-semibold">Active course</h2>
        <p className={`mt-1 ${muted}`}>
          None yet. Open a course below and tap “Make active course”. Its next lesson then becomes
          your external task on Today, instead of Duolingo.
        </p>
      </Card>
    );
  }
  return (
    <Card tone="accent">
      <h2 className="font-semibold">Active {library.active.length === 1 ? 'course' : 'courses'}</h2>
      <ul className="mt-2 space-y-2" data-testid="active-courses">
        {library.active.map((id) => {
          const resource = findResource(library, id);
          if (!resource) return null;
          const state = stateOf(library, id);
          const done = state.units.filter((u) => u.doneOn).length;
          const next = unitForToday(state, today);
          return (
            <li key={id}>
              <Link
                to={`/library/${encodeURIComponent(id)}`}
                className="flex min-h-10 items-center justify-between gap-3"
              >
                <span>
                  <span className="block font-medium">{resource.name}</span>
                  <span className="block text-sm text-teal-100">
                    {state.units.length === 0
                      ? 'Add its lessons to track them'
                      : next
                        ? `Next: ${next.title} · ${done} / ${state.units.length} done`
                        : `All ${state.units.length} units done`}
                  </span>
                </span>
                <span aria-hidden="true">›</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function RecommendedPath({ library }: { library: LibraryProgress }) {
  const settings = useAppStore((s) => s.settings);
  const activity = useAppStore((s) => s.activity);
  const today = todayISO();
  const stages = buildRoadmap(effectiveStartDate(activity, today), settings.departureDate);
  const current = roadmapPosition(stages, today, settings.departureDate).stageId;

  const index = Math.max(
    0,
    PATH.findIndex((step) => step.stage === current),
  );
  const renderStep = (step: PathStep, now: boolean) => (
    <li
      key={step.id}
      className={`rounded-xl p-3 ${now ? 'bg-teal-50 dark:bg-teal-950' : ''}`}
      aria-current={now ? 'step' : undefined}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-medium">
          {PATH.indexOf(step) + 1}. {step.title}
        </h3>
        {now && (
          <span className="shrink-0 text-xs font-semibold text-teal-700 dark:text-teal-400">
            Now
          </span>
        )}
      </div>
      <p className={`mt-1 ${muted}`}>{step.text}</p>
      <ul className="mt-1 flex flex-wrap gap-x-3">
        {step.refs.map((id) => (
          <li key={id}>
            <Link
              to={`/library/${encodeURIComponent(id)}`}
              className="inline-flex min-h-10 items-center text-sm font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-400"
            >
              {findResource(library, id)?.name ?? id}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );

  return (
    <Card>
      <h2 className="font-semibold">Recommended path</h2>
      <p className={`mt-1 ${muted}`}>A few resources for your current stage, not ten at once.</p>
      <ol className="mt-3" data-testid="path">
        {renderStep(PATH[index]!, true)}
      </ol>
      <details className="mt-1">
        <summary className="flex min-h-10 cursor-pointer items-center text-sm font-medium text-teal-700 dark:text-teal-400">
          All {PATH.length} stages
        </summary>
        <ol className="space-y-1">{PATH.map((step, i) => renderStep(step, i === index))}</ol>
      </details>
    </Card>
  );
}
