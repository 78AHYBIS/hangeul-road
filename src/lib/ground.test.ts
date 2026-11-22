import { describe, expect, it } from 'vitest';
import { isOnTheGround, lastBackupText, semesterStatus } from './ground';

describe('isOnTheGround', () => {
  it('switches on automatically from the departure day', () => {
    expect(isOnTheGround('auto', 1)).toBe(false);
    expect(isOnTheGround('auto', 0)).toBe(true);
    expect(isOnTheGround('auto', -30)).toBe(true);
  });

  it('can be forced on or off', () => {
    expect(isOnTheGround('on', 90)).toBe(true);
    expect(isOnTheGround('off', -30)).toBe(false);
  });
});

describe('semesterStatus', () => {
  it('counts days in Korea from the departure day', () => {
    expect(semesterStatus(0, 113)).toEqual({ dayInKorea: 1, daysLeft: 113 });
    expect(semesterStatus(-9, 104)).toEqual({ dayInKorea: 10, daysLeft: 104 });
  });
});

describe('lastBackupText', () => {
  it('reads calmly for every case', () => {
    expect(lastBackupText(null)).toBe('No backup yet.');
    expect(lastBackupText(0)).toBe('Last backup: today.');
    expect(lastBackupText(1)).toBe('Last backup: yesterday.');
    expect(lastBackupText(12)).toBe('Last backup: 12 days ago.');
  });
});
