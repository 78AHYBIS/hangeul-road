import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { btnPrimary, btnSecondary, chip, inputClass, muted } from '../../components/ui';
import { COST_LABEL, LEVEL_LABEL, SKILL_LABEL, TYPE_LABEL } from '../../content/resources';
import { formatLongDate } from '../../lib/date';
import {
  MAX_ACTIVE,
  STATUSES,
  STATUS_LABEL,
  numberedTitles,
  stateOf,
} from '../../lib/libraryProgress';
import { useAppStore } from '../../lib/storage/store';
import { findResource } from './resources';

/** "www.coursera.org/learn/x" → "coursera.org", for the link button. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'link';
  }
}

export function ResourcePage() {
  const { id = '' } = useParams();
  const library = useAppStore((s) => s.library);
  const resource = findResource(library, id);

  if (!resource) {
    return (
      <Page title="Not found" back={{ to: '/library', label: 'Library' }}>
        <p className={muted}>This resource is not in the library.</p>
      </Page>
    );
  }
  const state = stateOf(library, id);
  const active = library.active.includes(id);

  return (
    <Page title={resource.name} back={{ to: '/library', label: 'Library' }}>
      <div className="-mt-3 flex flex-wrap gap-1.5">
        <span className={chip}>{TYPE_LABEL[resource.type]}</span>
        <span className={chip}>{COST_LABEL[resource.cost]}</span>
        {!resource.custom && <span className={chip}>{LEVEL_LABEL[resource.level]}</span>}
        {resource.optional && <span className={chip}>Optional</span>}
        {resource.skills.map((s) => (
          <span key={s} className={chip}>
            {SKILL_LABEL[s]}
          </span>
        ))}
      </div>

      <Card>
        {resource.description && <p>{resource.description}</p>}
        {resource.why && (
          <>
            <h2 className="mt-3 text-sm font-semibold">Why it helps you</h2>
            <p className="mt-0.5">{resource.why}</p>
          </>
        )}
        {resource.note && (
          <>
            <h2 className="mt-3 text-sm font-semibold">Good to know</h2>
            <p className="mt-0.5">{resource.note}</p>
          </>
        )}
        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btnPrimary} mt-4 flex w-full items-center justify-center`}
          >
            Open {hostOf(resource.url)} ↗
          </a>
        )}
        <p className={`mt-2 ${muted}`}>
          {resource.custom
            ? 'Added by you. Not checked by the app.'
            : `Link and details checked on ${formatLongDate(resource.lastVerified)}. Prices and plans change; look on the site before paying.`}
        </p>
      </Card>

      <Card>
        <h2 className="font-semibold">My status</h2>
        <StatusPicker id={id} value={state.status} />
        <ActiveToggle id={id} active={active} />
      </Card>

      {(active || state.units.length > 0) && <Units key={id} id={id} />}

      <Notes key={id} id={id} initial={state.notes} />

      {resource.custom && <RemoveCustom id={id} name={resource.name} />}
    </Page>
  );
}

function StatusPicker({ id, value }: { id: string; value: (typeof STATUSES)[number] }) {
  const setResourceStatus = useAppStore((s) => s.setResourceStatus);
  return (
    <div
      role="radiogroup"
      aria-label="My status"
      className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-800"
    >
      {STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          role="radio"
          aria-checked={status === value}
          onClick={() => void setResourceStatus(id, status)}
          className={`min-h-10 rounded-lg text-sm font-medium ${
            status === value
              ? 'bg-white text-teal-700 shadow-sm dark:bg-stone-950 dark:text-teal-400'
              : 'text-stone-600 dark:text-stone-300'
          }`}
        >
          {STATUS_LABEL[status]}
        </button>
      ))}
    </div>
  );
}

function ActiveToggle({ id, active }: { id: string; active: boolean }) {
  const library = useAppStore((s) => s.library);
  const toggleActiveCourse = useAppStore((s) => s.toggleActiveCourse);
  const full = !active && library.active.length >= MAX_ACTIVE;
  const others = library.active.map((a) => findResource(library, a)?.name ?? a);

  return (
    <div className="mt-4">
      <button
        type="button"
        className={`${active ? btnSecondary : btnPrimary} w-full`}
        disabled={full}
        onClick={() => void toggleActiveCourse(id)}
        data-testid="toggle-active"
      >
        {active ? 'Stop as active course' : 'Make active course'}
      </button>
      <p className={`mt-2 ${muted}`}>
        {active
          ? 'Its next unit is your external task on Today.'
          : full
            ? `You already have ${MAX_ACTIVE} active courses (${others.join(' and ')}). Stop one first, so you can focus.`
            : `Track its lessons here; the next one shows on Today. At most ${MAX_ACTIVE} at a time.`}
      </p>
    </div>
  );
}

function Units({ id }: { id: string }) {
  const units = useAppStore((s) => stateOf(s.library, id).units);
  const addCourseUnits = useAppStore((s) => s.addCourseUnits);
  const toggleCourseUnit = useAppStore((s) => s.toggleCourseUnit);
  const removeCourseUnit = useAppStore((s) => s.removeCourseUnit);
  const [title, setTitle] = useState('');
  const [many, setMany] = useState('');
  const [prefix, setPrefix] = useState('Lesson');
  const [count, setCount] = useState('10');
  const done = units.filter((u) => u.doneOn).length;

  function addOne(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    void addCourseUnits(id, [title]);
    setTitle('');
  }

  function addPasted() {
    void addCourseUnits(id, many.split('\n'));
    setMany('');
  }

  function addNumbered() {
    void addCourseUnits(id, numberedTitles(prefix, Number(count), units.length + 1));
  }

  return (
    <Card>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold">Lessons and units</h2>
        <p className={`tabular-nums ${muted}`}>
          {done} / {units.length}
        </p>
      </div>
      {units.length === 0 && (
        <p className={`mt-1 ${muted}`}>
          Add the lessons of this course, in order. The first one not done shows on Today.
        </p>
      )}
      <ul className="mt-2 divide-y divide-stone-200 dark:divide-stone-800" data-testid="units">
        {units.map((unit) => (
          <li key={unit.id} className="flex items-center gap-3 py-1.5">
            <label className="flex min-h-10 flex-1 items-center gap-3">
              <input
                type="checkbox"
                className="size-6 shrink-0 accent-teal-700"
                checked={Boolean(unit.doneOn)}
                onChange={() => void toggleCourseUnit(id, unit.id)}
              />
              <span
                className={unit.doneOn ? 'text-stone-500 line-through dark:text-stone-400' : ''}
              >
                {unit.title}
              </span>
            </label>
            <button
              type="button"
              aria-label={`Remove ${unit.title}`}
              className="min-h-10 min-w-10 rounded-lg text-stone-500 dark:text-stone-400"
              onClick={() => void removeCourseUnit(id, unit.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={addOne} className="mt-3 flex items-end gap-2">
        <label className="block flex-1 text-sm font-medium">
          Add a unit
          <input
            className={inputClass}
            value={title}
            placeholder="e.g. Lesson 4: Particles"
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <button type="submit" className={btnPrimary}>
          Add
        </button>
      </form>

      <details className="mt-3">
        <summary className="flex min-h-10 cursor-pointer items-center text-sm font-medium text-teal-700 dark:text-teal-400">
          Add many at once
        </summary>
        <div className="mt-2 space-y-3">
          <div className="flex items-end gap-2">
            <label className="block flex-1 text-sm font-medium">
              Name
              <input
                className={inputClass}
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
              />
            </label>
            <label className="block w-20 text-sm font-medium">
              How many
              <input
                className={inputClass}
                inputMode="numeric"
                value={count}
                onChange={(e) => setCount(e.target.value.replace(/\D/g, '').slice(0, 3))}
              />
            </label>
            <button
              type="button"
              className={btnSecondary}
              disabled={!Number(count)}
              onClick={addNumbered}
            >
              Add
            </button>
          </div>
          <p className={muted}>
            Adds “{prefix.trim() || 'Unit'} {units.length + 1}” onwards.
          </p>
          <label className="block text-sm font-medium">
            Or paste a list, one unit per line
            <textarea
              className={`${inputClass} min-h-24`}
              value={many}
              onChange={(e) => setMany(e.target.value)}
            />
          </label>
          <button
            type="button"
            className={`${btnSecondary} w-full`}
            disabled={!many.trim()}
            onClick={addPasted}
          >
            Add these
          </button>
        </div>
      </details>
    </Card>
  );
}

function Notes({ id, initial }: { id: string; initial: string }) {
  const setResourceNotes = useAppStore((s) => s.setResourceNotes);
  // Local state keeps typing smooth; every change is saved straight away.
  const [notes, setNotes] = useState(initial);
  return (
    <Card>
      <label className="block font-semibold" htmlFor="notes">
        My notes
      </label>
      <textarea
        id="notes"
        className={`${inputClass} min-h-24`}
        value={notes}
        placeholder="Where you stopped, what to try next…"
        onChange={(e) => {
          setNotes(e.target.value);
          void setResourceNotes(id, e.target.value);
        }}
      />
      <p className={`mt-1 ${muted}`}>Saved as you type.</p>
    </Card>
  );
}

function RemoveCustom({ id, name }: { id: string; name: string }) {
  const removeCustomResource = useAppStore((s) => s.removeCustomResource);
  const navigate = useNavigate();
  return (
    <p className="text-center">
      <button
        type="button"
        className="min-h-10 px-3 text-sm text-stone-500 underline"
        onClick={() => {
          if (!window.confirm(`Remove ${name} and its notes?`)) return;
          void removeCustomResource(id).then(() => navigate('/library'));
        }}
      >
        Remove this resource
      </button>
    </p>
  );
}
