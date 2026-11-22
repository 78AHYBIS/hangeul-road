import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { inputClass, muted } from '../../components/ui';
import {
  APP_CATEGORIES,
  CATEGORY_TITLE,
  KOREA_APPS,
  type AppCategory,
} from '../../content/korea-apps';
import { searchApps } from './guide';
import { accessChips } from './labels';
import { Chips } from './shared';

export function AppsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<AppCategory | ''>('');
  const [beforeOnly, setBeforeOnly] = useState(false);
  const shown = searchApps(query).filter(
    (app) => (!category || app.category === category) && (!beforeOnly || app.setup === 'before'),
  );

  return (
    <Page
      title="Korea apps"
      subtitle="What to install, what each app is for, and what needs a Korean number or an ARC."
      back={{ to: '/korea', label: 'Korea' }}
    >
      <Card>
        <label className="block text-sm font-medium">
          Search
          <input
            type="search"
            className={inputClass}
            placeholder="e.g. taxi, delivery, 지도"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            Category
            <select
              className={`${inputClass} min-h-10 dark:bg-stone-900`}
              value={category}
              onChange={(e) => setCategory(e.target.value as AppCategory | '')}
            >
              <option value="">All</option>
              {APP_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_TITLE[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-6 flex min-h-10 items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="size-5 accent-teal-700"
              checked={beforeOnly}
              onChange={(e) => setBeforeOnly(e.target.checked)}
            />
            Works before you fly
          </label>
        </div>
      </Card>

      <p className={muted} role="status" data-testid="app-count">
        {shown.length} of {KOREA_APPS.length} apps. Rules for foreigners change often: each app
        shows when it was last checked.
      </p>

      {APP_CATEGORIES.map((c) => {
        const apps = shown.filter((app) => app.category === c);
        if (apps.length === 0) return null;
        return (
          <section key={c} aria-labelledby={`cat-${c}`}>
            <h2 id={`cat-${c}`} className="mb-2 text-lg font-semibold">
              {CATEGORY_TITLE[c]}
            </h2>
            <Card>
              <ul className="divide-y divide-stone-200 dark:divide-stone-800" data-testid="apps">
                {apps.map((app) => (
                  <li key={app.id}>
                    <Link
                      to={`/korea/apps/${app.id}`}
                      className="flex min-h-14 items-center justify-between gap-3 py-2.5"
                    >
                      <span className="min-w-0">
                        <span className="block font-medium">
                          {app.name}
                          {app.korean && (
                            <span className={`ml-2 font-normal ${muted}`} lang="ko">
                              {app.korean}
                            </span>
                          )}
                        </span>
                        <span className={`block ${muted}`}>{app.what}</span>
                        <Chips items={accessChips(app)} />
                      </span>
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-teal-700 dark:text-teal-400"
                      >
                        ›
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        );
      })}
      {shown.length === 0 && <p className={muted}>Nothing matches. Try another word.</p>}
    </Page>
  );
}
