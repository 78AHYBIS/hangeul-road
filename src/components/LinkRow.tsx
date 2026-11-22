import { Link } from 'react-router-dom';
import { muted } from './ui';
import { MixedText } from './MixedText';

/** A tappable row in a list: title, one line of text, and a ✓ when done. */
export function LinkRow({
  to,
  title,
  text,
  done,
  lang,
}: {
  to: string;
  title: string;
  text: string;
  done?: boolean;
  /** Set to 'ko' when the title is Korean. */
  lang?: string;
}) {
  return (
    <li>
      <Link to={to} className="flex min-h-14 items-center justify-between gap-3 py-2">
        <span>
          <span className="block font-medium" lang={lang}>
            <MixedText text={title} />
          </span>
          <span className={`block ${muted}`}>
            <MixedText text={text} />
          </span>
        </span>
        <span className="shrink-0 text-teal-700 dark:text-teal-400">
          {done ? <span aria-label="done">✓</span> : <span aria-hidden="true">›</span>}
        </span>
      </Link>
    </li>
  );
}
