import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** Standard page frame: title, optional subtitle, then content. */
export function Page({
  title,
  subtitle,
  back,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Optional "back" link shown above the title. */
  back?: { to: string; label: string };
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
            ‹ {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{subtitle}</p>}
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

/** Placeholder list of what a later phase will add to a section. */
export function ComingSoon({ items }: { items: { title: string; text: string; phase: number }[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.title}>
          <Card>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold">{item.title}</h2>
              <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                Phase {item.phase}
              </span>
            </div>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{item.text}</p>
          </Card>
        </li>
      ))}
    </ul>
  );
}
