/**
 * On-the-ground mode: after arrival, Today shows the semester instead of the countdown,
 * with the phrasebook, apps guide and reviews at the top.
 */
import type { GroundMode } from './storage/schema';

/** Automatic mode switches on from the departure day (0 days to go). */
export function isOnTheGround(mode: GroundMode, daysToDeparture: number): boolean {
  if (mode === 'on') return true;
  if (mode === 'off') return false;
  return daysToDeparture <= 0;
}

export interface SemesterStatus {
  /** 1 on the departure day, 2 the day after… 0 or less before departure. */
  dayInKorea: number;
  /** Days until the end of the semester (0 on the last day, negative after it). */
  daysLeft: number;
}

/** `daysToDeparture` and `daysToEnd` come from `daysUntil`, so this stays pure. */
export function semesterStatus(daysToDeparture: number, daysToEnd: number): SemesterStatus {
  return { dayInKorea: 1 - daysToDeparture, daysLeft: daysToEnd };
}

/** "Last backup: 12 days ago": calm wording, never a warning. */
export function lastBackupText(daysSince: number | null): string {
  if (daysSince === null || Number.isNaN(daysSince)) return 'No backup yet.';
  if (daysSince <= 0) return 'Last backup: today.';
  if (daysSince === 1) return 'Last backup: yesterday.';
  return `Last backup: ${daysSince} days ago.`;
}
