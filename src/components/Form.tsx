import type { ReactNode } from 'react';

/** One labelled setting: label and hint on top (or on the left when `inline`). */
export function Field({
  label,
  hint,
  inline = false,
  last = false,
  children,
}: {
  label: string;
  hint?: ReactNode;
  inline?: boolean;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`${inline ? 'flex items-center justify-between gap-4' : 'space-y-2'} ${
        last ? 'pt-4' : 'border-b border-stone-200 py-4 first:pt-0 dark:border-stone-800'
      }`}
    >
      <div>
        <p className="font-medium">{label}</p>
        {hint && <p className="text-sm text-stone-500 dark:text-stone-400">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

/** A row of buttons where exactly one is selected (a nicer radio group). */
export function Segmented<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className="flex rounded-xl bg-stone-100 p-1 dark:bg-stone-800"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={`min-h-10 flex-1 rounded-lg px-1 text-sm font-medium ${
            option.value === value
              ? 'bg-white text-teal-800 shadow-sm dark:bg-stone-950 dark:text-teal-300'
              : 'text-stone-600 dark:text-stone-300'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export const dateInputClass =
  'min-h-11 w-full rounded-lg border border-stone-300 bg-transparent px-3 py-2 dark:border-stone-700';
