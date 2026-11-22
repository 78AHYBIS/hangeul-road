import { Link } from 'react-router-dom';
import { MixedText } from '../../components/MixedText';
import { chip, muted } from '../../components/ui';
import type { Checklist } from '../../content/korea-apps';
import { useAppStore } from '../../lib/storage/store';
import { todayISO } from '../../lib/date';
import { itemsForToday, refLinks } from './guide';

export function Chips({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {items.map((item) => (
        <span key={item} className={chip}>
          {item}
        </span>
      ))}
    </span>
  );
}

/** Links to related apps, answers, culture cards, resources or words. */
export function RelatedLinks({ ids, title = 'See also' }: { ids?: string[]; title?: string }) {
  const links = refLinks(ids);
  if (links.length === 0) return null;
  return (
    <div>
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-1 divide-y divide-stone-200 dark:divide-stone-800">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className="flex min-h-12 items-center justify-between gap-3 py-2">
              <span>
                <span className="block font-medium">
                  <MixedText text={link.title} />
                </span>
                <span className={`block ${muted}`}>{link.kind}</span>
              </span>
              <span aria-hidden="true" className="text-teal-700 dark:text-teal-400">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The items of a checklist with tick boxes. With `limit`, only today's items show
 * (used on Today).
 */
export function ChecklistItems({ checklist, limit }: { checklist: Checklist; limit?: number }) {
  const progress = useAppStore((s) => s.koreaGuide);
  const checked = progress.checked;
  const setChecklistItem = useAppStore((s) => s.setChecklistItem);
  const items =
    limit === undefined ? checklist.items : itemsForToday(checklist, progress, todayISO(), limit);
  return (
    <ul className="divide-y divide-stone-200 dark:divide-stone-800" data-testid="checklist-items">
      {items.map((item) => {
        const done = Boolean(checked[item.id]);
        const links = refLinks(item.refs);
        return (
          <li key={item.id} className="flex gap-3 py-3" data-item={item.id}>
            <input
              id={item.id}
              type="checkbox"
              className="mt-0.5 size-6 shrink-0 accent-teal-700"
              checked={done}
              onChange={() => void setChecklistItem(item.id, !done)}
            />
            <div className="min-w-0 flex-1">
              <label
                htmlFor={item.id}
                className={`block leading-relaxed ${done ? 'text-stone-500 line-through dark:text-stone-400' : ''}`}
              >
                <MixedText text={item.text} />
              </label>
              {links.length > 0 && (
                <p className="mt-0.5 flex flex-wrap gap-x-3 text-sm">
                  {links.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="inline-flex min-h-10 items-center text-teal-700 underline underline-offset-2 dark:text-teal-400"
                    >
                      <MixedText text={link.title} />
                    </Link>
                  ))}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
