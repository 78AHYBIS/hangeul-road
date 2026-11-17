/** Shared Tailwind class strings, so buttons look the same everywhere. */
export const btnPrimary =
  'min-h-12 rounded-xl bg-teal-700 px-4 font-medium text-white active:bg-teal-800 disabled:opacity-40';
export const btnSecondary =
  'min-h-12 rounded-xl border border-stone-300 px-4 font-medium disabled:opacity-40 dark:border-stone-700';
export const muted = 'text-sm text-stone-500 dark:text-stone-400';
export const inputClass =
  'mt-1 w-full rounded-lg border border-stone-300 bg-transparent px-3 py-2.5 dark:border-stone-700';
/** Small rounded label, e.g. "Free" or "YouTube". */
export const chip =
  'inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300';

/**
 * An answer button in a multiple-choice question: neutral before answering, then
 * teal for the right answer and amber for a wrong pick. Amber, not red: no alarm.
 */
export function choiceClass(answered: boolean, isAnswer: boolean, isPicked: boolean): string {
  if (!answered) return 'border-stone-300 dark:border-stone-700';
  if (isAnswer) return 'border-teal-700 bg-teal-700 text-white';
  if (isPicked) {
    return 'border-amber-500 bg-amber-100 text-amber-950 dark:bg-amber-900 dark:text-amber-50';
  }
  return 'border-stone-200 opacity-50 dark:border-stone-800';
}
