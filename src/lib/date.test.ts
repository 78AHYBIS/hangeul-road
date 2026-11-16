import { describe, expect, it } from 'vitest';
import { daysUntil, isValidISODate, parseISODate, toISODate } from './date';

describe('parseISODate', () => {
  it('parses a valid date as local midnight', () => {
    const date = parseISODate('2027-02-25');
    expect(date?.getFullYear()).toBe(2027);
    expect(date?.getMonth()).toBe(1);
    expect(date?.getDate()).toBe(25);
    expect(date?.getHours()).toBe(0);
  });

  it('rejects malformed and impossible dates', () => {
    expect(parseISODate('25.02.2027')).toBeNull();
    expect(parseISODate('2027-02-31')).toBeNull();
    expect(parseISODate('2027-13-01')).toBeNull();
    expect(isValidISODate(20270225)).toBe(false);
  });

  it('round-trips with toISODate', () => {
    expect(toISODate(parseISODate('2027-03-01')!)).toBe('2027-03-01');
  });
});

describe('daysUntil', () => {
  it('counts calendar days to departure', () => {
    expect(daysUntil('2027-02-25', new Date(2026, 10, 16, 9, 0))).toBe(101);
  });

  it('ignores the time of day', () => {
    expect(daysUntil('2027-02-25', new Date(2027, 1, 24, 0, 1))).toBe(1);
    expect(daysUntil('2027-02-25', new Date(2027, 1, 24, 23, 59))).toBe(1);
  });

  it('is 0 on the day and negative afterwards', () => {
    expect(daysUntil('2027-02-25', new Date(2027, 1, 25, 15, 0))).toBe(0);
    expect(daysUntil('2027-02-25', new Date(2027, 2, 1))).toBe(-4);
  });

  it('handles leap years', () => {
    expect(daysUntil('2028-03-01', new Date(2028, 1, 28))).toBe(2);
  });

  it('returns NaN for an invalid target', () => {
    expect(daysUntil('nope', new Date())).toBeNaN();
  });
});
