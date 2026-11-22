import { describe, expect, it } from 'vitest';
import { splitKorean } from './mixedText';

const korean = (text: string) =>
  splitKorean(text)
    .filter((r) => r.korean)
    .map((r) => r.text);

describe('splitKorean', () => {
  it('returns no runs for an empty string', () => {
    expect(splitKorean('')).toEqual([]);
  });

  it('keeps plain English as one run', () => {
    expect(splitKorean('No Korean here.')).toEqual([{ text: 'No Korean here.', korean: false }]);
  });

  it('keeps plain Korean as one run', () => {
    expect(splitKorean('김치가 매워요')).toEqual([{ text: '김치가 매워요', korean: true }]);
  });

  it('splits English and Korean in order, losing nothing', () => {
    const text = 'Spicy is 매워요 and difficult is 어렵다.';
    const runs = splitKorean(text);
    expect(runs).toEqual([
      { text: 'Spicy is ', korean: false },
      { text: '매워요', korean: true },
      { text: ' and difficult is ', korean: false },
      { text: '어렵다', korean: true },
      { text: '.', korean: false },
    ]);
    expect(runs.map((r) => r.text).join('')).toBe(text);
  });

  it('joins Korean words separated by spaces and punctuation', () => {
    expect(korean('Use 이에요 / 예요 after a noun.')).toEqual(['이에요 / 예요']);
    expect(korean('Say "물 주세요, 감사합니다" politely.')).toEqual(['물 주세요, 감사합니다']);
  });

  it('leaves trailing punctuation and spaces outside the run', () => {
    expect(splitKorean('(매워요) ')).toEqual([
      { text: '(', korean: false },
      { text: '매워요', korean: true },
      { text: ') ', korean: false },
    ]);
  });

  it('stops a run at a Latin letter', () => {
    expect(korean('먹다 (eat) 마시다')).toEqual(['먹다', '마시다']);
    expect(korean('Noun + 이에요')).toEqual(['이에요']);
  });

  it('keeps digits written straight before Hangul', () => {
    expect(korean('Meet at 3시 or 4 시.')).toEqual(['3시', '시']);
  });

  it('treats single jamo as Korean', () => {
    expect(korean('A final ㄱ sounds like k.')).toEqual(['ㄱ']);
  });
});
