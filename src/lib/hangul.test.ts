import { describe, expect, it } from 'vitest';
import {
  TYPEABLE_JAMO,
  compose,
  composePartial,
  decompose,
  jamoForKey,
  lettersIn,
  romanizeSyllable,
  toKeystrokes,
} from './hangul';

describe('compose / decompose', () => {
  it('builds syllable blocks', () => {
    expect(compose('ㅎ', 'ㅏ', 'ㄴ')).toBe('한');
    expect(compose('ㄱ', 'ㅏ')).toBe('가');
    expect(compose('ㅇ', 'ㅜ', 'ㄹ')).toBe('울');
    expect(compose('ㄷ', 'ㅏ', 'ㄺ')).toBe('닭');
    expect(compose('ㅏ', 'ㅏ')).toBe('');
  });

  it('splits blocks and round-trips', () => {
    expect(decompose('산')).toEqual({ initial: 'ㅅ', medial: 'ㅏ', final: 'ㄴ' });
    expect(decompose('의')).toEqual({ initial: 'ㅇ', medial: 'ㅢ', final: '' });
    expect(decompose('a')).toBeNull();
    for (const char of '울산유니스트한국값힣가') {
      const p = decompose(char)!;
      expect(compose(p.initial, p.medial, p.final)).toBe(char);
    }
  });
});

describe('romanizeSyllable', () => {
  it('romanizes single syllables', () => {
    expect(romanizeSyllable('가')).toBe('ga');
    expect(romanizeSyllable('한')).toBe('han');
    expect(romanizeSyllable('강')).toBe('gang');
    expect(romanizeSyllable('어')).toBe('eo');
    expect(romanizeSyllable('옷')).toBe('ot');
    expect(romanizeSyllable('밥')).toBe('bap');
    expect(romanizeSyllable('쌀')).toBe('ssal');
    expect(romanizeSyllable('의')).toBe('ui');
  });
});

describe('lettersIn', () => {
  it('lists distinct letters and splits double finals', () => {
    expect(lettersIn('한국').sort()).toEqual(['ㄱ', 'ㄴ', 'ㅎ', 'ㅏ', 'ㅜ'].sort());
    expect(lettersIn('값').sort()).toEqual(['ㄱ', 'ㅏ', 'ㅂ', 'ㅅ'].sort());
    expect(lettersIn('abc 123')).toEqual([]);
  });
});

describe('keyboard', () => {
  it('maps physical keys to letters', () => {
    expect(jamoForKey('KeyQ', false)).toBe('ㅂ');
    expect(jamoForKey('KeyQ', true)).toBe('ㅃ');
    expect(jamoForKey('KeyK', true)).toBe('ㅏ');
    expect(jamoForKey('KeyP', true)).toBe('ㅖ');
    expect(jamoForKey('Digit1', false)).toBeNull();
    expect(TYPEABLE_JAMO).toHaveLength(33);
  });

  it('turns text into key presses', () => {
    expect(toKeystrokes('한국')).toEqual([
      { char: '한', keys: ['ㅎ', 'ㅏ', 'ㄴ'] },
      { char: '국', keys: ['ㄱ', 'ㅜ', 'ㄱ'] },
    ]);
    expect(toKeystrokes('왜')[0]!.keys).toEqual(['ㅇ', 'ㅗ', 'ㅐ']);
    expect(toKeystrokes('값')[0]!.keys).toEqual(['ㄱ', 'ㅏ', 'ㅂ', 'ㅅ']);
    expect(toKeystrokes('밖')[0]!.keys).toEqual(['ㅂ', 'ㅏ', 'ㄲ']);
    expect(toKeystrokes('ㅘ')[0]!.keys).toEqual(['ㅗ', 'ㅏ']);
    expect(toKeystrokes('버스 정류장')).toHaveLength(5);
  });

  it('shows the block growing as keys are typed', () => {
    expect([0, 1, 2, 3, 4].map((n) => composePartial('값', n))).toEqual([
      '',
      'ㄱ',
      '가',
      '갑',
      '값',
    ]);
    expect([1, 2, 3, 4].map((n) => composePartial('환', n))).toEqual(['ㅎ', '호', '화', '환']);
    expect(composePartial('ㅘ', 1)).toBe('ㅗ');
    expect(composePartial('ㅘ', 2)).toBe('ㅘ');
  });
});
