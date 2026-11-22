import { Suspense, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from './nav';
import { applyUpdate, usePwa } from './pwa';

export function Layout() {
  const { pathname } = useLocation();
  // Each new screen starts at the top. The braces matter: an effect must not return
  // scrollTo's result (a Promise in new browsers), or React treats it as a cleanup function.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <a
        href="#main"
        onClick={(e) => {
          // HashRouter owns the # in the URL, so move focus by hand instead of navigating.
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
        className="sr-only z-50 rounded-lg bg-teal-700 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <UpdateBar />
      <main id="main" tabIndex={-1} className="flex-1 px-4 pt-6 pb-24 outline-none">
        <Suspense fallback={<p className="sr-only">Loading…</p>}>
          <Outlet />
        </Suspense>
      </main>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/95"
      >
        <ul className="mx-auto flex max-w-xl">
          {NAV_ITEMS.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                    isActive
                      ? 'text-teal-700 dark:text-teal-400'
                      : 'text-stone-500 dark:text-stone-400'
                  }`
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={item.icon} />
                </svg>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/** Shown when a new version of the app is installed and waiting. */
function UpdateBar() {
  const { updateReady } = usePwa();
  if (!updateReady) return null;
  return (
    <div
      role="status"
      className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm text-teal-950 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-50"
    >
      <span>A new version of the app is ready.</span>
      <button
        type="button"
        onClick={applyUpdate}
        className="min-h-10 shrink-0 rounded-lg bg-teal-700 px-3 font-medium text-white"
      >
        Reload
      </button>
    </div>
  );
}
