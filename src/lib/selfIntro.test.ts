import { describe, expect, it } from 'vitest';
import {
  EMPTY_INTRO,
  buildIntro,
  needsHangul,
  sanitizeIntro,
  type IntroDetails,
} from './selfIntro';

const aidar: IntroDetails = {
  name: '아이다르',
  country: '카자흐스탄',
  university: '유니스트',
  exchange: true,
  major: '정보시스템',
  hobbies: ['여행', '요리'],
};

const korean = (details: IntroDetails, style: 'polite' | 'formal') =>
  buildIntro(details, style).map((l) => l.korean);

describe('self-introduction builder', () => {
  it('builds a polite 해요-style introduction with the right particles', () => {
    expect(korean(aidar, 'polite')).toEqual([
      '안녕하세요.',
      '저는 아이다르예요.',
      '카자흐스탄에서 왔어요.',
      '저는 유니스트 교환학생이에요.',
      '제 전공은 정보시스템이에요.',
      '제 취미는 여행과 요리예요.',
      '만나서 반가워요.',
      '잘 부탁드려요.',
    ]);
  });

  it('builds the formal 합니다 version', () => {
    expect(korean(aidar, 'formal')).toEqual([
      '안녕하세요.',
      '처음 뵙겠습니다.',
      '저는 아이다르입니다.',
      '카자흐스탄에서 왔습니다.',
      '저는 유니스트 교환학생입니다.',
      '제 전공은 정보시스템입니다.',
      '제 취미는 여행과 요리입니다.',
      '만나서 반갑습니다.',
      '잘 부탁드립니다.',
    ]);
  });

  it('changes the particles with the words', () => {
    const lines = korean(
      { ...aidar, name: '민수', major: '경영학', hobbies: ['요리', '독서'], exchange: false },
      'polite',
    );
    expect(lines).toContain('저는 민수예요.');
    expect(lines).toContain('제 전공은 경영학이에요.');
    expect(lines).toContain('제 취미는 요리와 독서예요.');
    expect(lines).toContain('저는 유니스트 학생이에요.');
  });

  it('gives English meanings, including country and major names', () => {
    const meanings = buildIntro(aidar, 'polite').map((l) => l.meaning);
    expect(meanings).toContain("I'm from Kazakhstan.");
    expect(meanings).toContain('My major is Information Systems.');
    expect(meanings).toContain('My hobbies are travelling and cooking.');
    const one = buildIntro({ ...aidar, hobbies: ['독서'] }, 'polite').map((l) => l.meaning);
    expect(one).toContain('My hobby is reading.');
  });

  it('leaves out lines with missing details', () => {
    expect(korean({ ...EMPTY_INTRO, university: '' }, 'polite')).toEqual([
      '안녕하세요.',
      '만나서 반가워요.',
      '잘 부탁드려요.',
    ]);
  });

  it('falls back to 입니다 for a name in Latin letters, and flags it', () => {
    expect(korean({ ...aidar, name: 'Aidar' }, 'polite')).toContain('저는 Aidar입니다.');
    expect(needsHangul('Aidar')).toBe(true);
    expect(needsHangul('아이다르')).toBe(false);
    expect(needsHangul('')).toBe(false);
  });

  it('sanitizes saved details', () => {
    expect(sanitizeIntro(null)).toEqual(EMPTY_INTRO);
    expect(sanitizeIntro({ name: ' 민수', hobbies: ['a', 'b', 'c', 1], exchange: 'yes' })).toEqual({
      ...EMPTY_INTRO,
      name: '민수',
      hobbies: ['a', 'b'],
    });
  });
});
