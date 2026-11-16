import { describe, expect, it } from 'vitest';
import { clockTime, native, nativeCounter, phoneNumber, price, sino } from './numbers';

describe('sino', () => {
  it.each([
    [0, '영'],
    [1, '일'],
    [6, '육'],
    [10, '십'],
    [11, '십일'],
    [20, '이십'],
    [99, '구십구'],
    [100, '백'],
    [101, '백일'],
    [110, '백십'],
    [365, '삼백육십오'],
    [1000, '천'],
    [1500, '천오백'],
    [2027, '이천이십칠'],
    [10000, '만'],
    [15000, '만 오천'],
    [25500, '이만 오천오백'],
    [100000, '십만'],
    [110000, '십일만'],
    [1000000, '백만'],
  ])('%i -> %s', (n, expected) => expect(sino(n)).toBe(expected));
});

describe('native', () => {
  it.each([
    [1, '하나'],
    [2, '둘'],
    [3, '셋'],
    [4, '넷'],
    [10, '열'],
    [11, '열하나'],
    [20, '스물'],
    [21, '스물하나'],
    [35, '서른다섯'],
    [99, '아흔아홉'],
  ])('%i -> %s', (n, expected) => expect(native(n)).toBe(expected));

  it.each([
    [1, '한'],
    [2, '두'],
    [3, '세'],
    [4, '네'],
    [5, '다섯'],
    [11, '열한'],
    [12, '열두'],
    [20, '스무'],
    [21, '스물한'],
    [23, '스물세'],
  ])('counter form %i -> %s', (n, expected) => expect(nativeCounter(n)).toBe(expected));
});

describe('time, price, phone', () => {
  it('reads clock times with native hours and Sino minutes', () => {
    expect(clockTime(3, 20)).toBe('세 시 이십 분');
    expect(clockTime(12, 0)).toBe('열두 시');
    expect(clockTime(1, 5)).toBe('한 시 오 분');
  });

  it('reads prices', () => {
    expect(price(4500)).toBe('사천오백 원');
    expect(price(15000)).toBe('만 오천 원');
  });

  it('reads phone numbers digit by digit with 공 for zero', () => {
    expect(phoneNumber('010-1234-5678')).toBe('공일공 일이삼사 오육칠팔');
  });
});
