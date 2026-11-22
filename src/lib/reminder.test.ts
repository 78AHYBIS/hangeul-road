import { describe, expect, it } from 'vitest';
import { minutesOf, msUntil, reminderDue, type ReminderCheck } from './reminder';

const base: ReminderCheck = {
  on: true,
  time: '19:00',
  today: '2026-11-22',
  nowMinutes: minutesOf('19:05'),
  lastShown: null,
  studiedToday: false,
};

describe('reminderDue', () => {
  it('is due after the chosen time on a day with no study', () => {
    expect(reminderDue(base)).toBe(true);
  });

  it('waits until the chosen time', () => {
    expect(reminderDue({ ...base, nowMinutes: minutesOf('18:59') })).toBe(false);
  });

  it('is shown at most once a day', () => {
    expect(reminderDue({ ...base, lastShown: '2026-11-22' })).toBe(false);
    expect(reminderDue({ ...base, lastShown: '2026-11-21' })).toBe(true);
  });

  it('stays quiet once something was studied, or when switched off', () => {
    expect(reminderDue({ ...base, studiedToday: true })).toBe(false);
    expect(reminderDue({ ...base, on: false })).toBe(false);
  });
});

describe('msUntil', () => {
  it('counts down to the reminder time and stops at zero', () => {
    expect(msUntil('19:00', minutesOf('18:59'), 30)).toBe(30_000);
    expect(msUntil('19:00', minutesOf('19:10'), 0)).toBe(0);
  });
});
