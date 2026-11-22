import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MixedText } from './MixedText';

/** Standard page frame: title, optional subtitle, then content. */
export function Page({
  title,
  subtitle,
  back,
  searchable = false,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Optional "back" link shown above the title. */
  back?: { to: string; label: string };
  /** Shows a search button next to the title (the five main tabs). */
  searchable?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <header>
        {back && (
          <Link
            to={back.to}
            className="-ml-1 mb-1 inline-flex min-h-10 items-center text-sm font-medium text-teal-700 dark:text-teal-400"
          >
            <span>
              ‹ <MixedText text={back.label} />
            </span>
          </Link>
        )}
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            <MixedText text={title} />
          </h1>
          {searchable && (
            <Link
              to="/search"
              aria-label="Search everything"
              className="-mt-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM15.5 15.5 20 20" />
              </svg>
            </Link>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            <MixedText text={subtitle} />
          </p>
        )}
      </header>
      {children}
    </div>
  );
}

/**
 * `tone="accent"` is the teal highlight card. It is a prop (not extra classes)
 * because two background classes on one element conflict in Tailwind.
 */
export function Card({
  children,
  tone = 'plain',
}: {
  children: ReactNode;
  tone?: 'plain' | 'accent';
}) {
  const colors =
    tone === 'accent'
      ? 'bg-teal-700 text-white dark:bg-teal-800'
      : 'border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900';
  return <section className={`rounded-2xl p-4 ${colors}`}>{children}</section>;
}
