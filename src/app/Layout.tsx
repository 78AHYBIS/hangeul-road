import { NavLink, Outlet } from 'react-router-dom';
import { NAV_ITEMS } from './nav';

export function Layout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <main className="flex-1 px-4 pt-6 pb-24">
        <Outlet />
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
