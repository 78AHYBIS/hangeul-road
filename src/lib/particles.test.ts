import { describe, expect, it } from 'vitest';
import { endsInConsonant, particleFor, withParticle } from './particles';

describe('particles', () => {
  it('tells consonant endings from vowel endings', () => {
    expect(endsInConsonant('학생')).toBe(true);
    expect(endsInConsonant('의사')).toBe(false);
    expect(endsInConsonant('음악 감상')).toBe(true);
    expect(endsInConsonant('Aidar')).toBeNull();
    expect(endsInConsonant('')).toBeNull();
  });

  it('picks the right form of each particle', () => {
    expect(withParticle('학생', 'copula')).toBe('학생이에요');
    expect(withParticle('의사', 'copula')).toBe('의사예요');
    expect(withParticle('아이다르', 'copula')).toBe('아이다르예요');
    expect(withParticle('이름', 'topic')).toBe('이름은');
    expect(withParticle('저', 'topic')).toBe('저는');
    expect(withParticle('시간', 'subject')).toBe('시간이');
    expect(withParticle('비', 'subject')).toBe('비가');
    expect(withParticle('밥', 'object')).toBe('밥을');
    expect(withParticle('커피', 'object')).toBe('커피를');
    expect(withParticle('여행', 'and')).toBe('여행과');
    expect(withParticle('요리', 'and')).toBe('요리와');
    expect(withParticle('Aidar', 'copula')).toBeNull();
  });

  it('uses 로 after a vowel or ㄹ and 으로 after other consonants', () => {
    expect(particleFor('카드', 'with')).toBe('로');
    expect(particleFor('지하철', 'with')).toBe('로');
    expect(particleFor('현금', 'with')).toBe('으로');
  });

  it('reads digits the Sino-Korean way', () => {
    expect(withParticle('305호', 'copula')).toBe('305호예요');
    expect(particleFor('2', 'copula')).toBe('예요'); // 이
    expect(particleFor('3', 'copula')).toBe('이에요'); // 삼
    expect(particleFor('1', 'with')).toBe('로'); // 일
    expect(particleFor('10', 'copula')).toBe('이에요'); // 십: tens, hundreds... all end in a consonant
  });
});
