/**
 * The self-introduction builder: details in, a correct polite introduction out.
 * Particles are chosen with particles.ts, so the sentences fit any Hangul word.
 */
import { particleFor, withParticle } from './particles';

export type IntroStyle = 'polite' | 'formal';

export interface IntroDetails {
  /** Written in Hangul for the 해요 style; Latin letters fall back to 입니다. */
  name: string;
  country: string;
  university: string;
  /** "exchange student at…" (true) or "student at…" (false). */
  exchange: boolean;
  major: string;
  /** At most two. */
  hobbies: string[];
}

export const EMPTY_INTRO: IntroDetails = {
  name: '',
  country: '',
  university: '유니스트',
  exchange: true,
  major: '',
  hobbies: [],
};

export interface Choice {
  korean: string;
  english: string;
}

export const COUNTRIES: Choice[] = [
  { korean: '카자흐스탄', english: 'Kazakhstan' },
  { korean: '우즈베키스탄', english: 'Uzbekistan' },
  { korean: '키르기스스탄', english: 'Kyrgyzstan' },
  { korean: '러시아', english: 'Russia' },
  { korean: '몽골', english: 'Mongolia' },
  { korean: '중국', english: 'China' },
  { korean: '일본', english: 'Japan' },
  { korean: '베트남', english: 'Vietnam' },
  { korean: '인도', english: 'India' },
  { korean: '미국', english: 'the USA' },
  { korean: '영국', english: 'the UK' },
  { korean: '독일', english: 'Germany' },
  { korean: '프랑스', english: 'France' },
];

export const MAJORS: Choice[] = [
  { korean: '정보시스템', english: 'Information Systems' },
  { korean: '컴퓨터공학', english: 'Computer Science and Engineering' },
  { korean: '경영학', english: 'Business' },
  { korean: '경제학', english: 'Economics' },
  { korean: '산업공학', english: 'Industrial Engineering' },
  { korean: '전기전자공학', english: 'Electrical and Electronic Engineering' },
  { korean: '기계공학', english: 'Mechanical Engineering' },
  { korean: '디자인', english: 'Design' },
  { korean: '생명과학', english: 'Life Sciences' },
  { korean: '화학', english: 'Chemistry' },
  { korean: '물리학', english: 'Physics' },
  { korean: '수학', english: 'Mathematics' },
];

export const HOBBIES: Choice[] = [
  { korean: '독서', english: 'reading' },
  { korean: '운동', english: 'working out' },
  { korean: '요리', english: 'cooking' },
  { korean: '여행', english: 'travelling' },
  { korean: '음악 감상', english: 'listening to music' },
  { korean: '영화 감상', english: 'watching films' },
  { korean: '축구', english: 'football' },
  { korean: '농구', english: 'basketball' },
  { korean: '수영', english: 'swimming' },
  { korean: '등산', english: 'hiking' },
  { korean: '사진 찍기', english: 'taking photos' },
  { korean: '그림 그리기', english: 'drawing' },
  { korean: '게임', english: 'gaming' },
  { korean: '코딩', english: 'coding' },
];

export const MAX_HOBBIES = 2;
const MAX_TEXT = 40;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
// Only leading spaces go: a trailing one may be mid-typing ("음악 감상"). buildIntro trims.
const text = (v: unknown) =>
  typeof v === 'string' ? v.replace(/^\s+/, '').slice(0, MAX_TEXT) : '';

export function sanitizeIntro(raw: unknown): IntroDetails {
  if (!isRecord(raw)) return EMPTY_INTRO;
  return {
    name: text(raw.name),
    country: text(raw.country),
    university: typeof raw.university === 'string' ? text(raw.university) : EMPTY_INTRO.university,
    exchange: typeof raw.exchange === 'boolean' ? raw.exchange : EMPTY_INTRO.exchange,
    major: text(raw.major),
    hobbies: Array.isArray(raw.hobbies)
      ? [...new Set(raw.hobbies.map((h) => text(h).trim()).filter(Boolean))].slice(0, MAX_HOBBIES)
      : [],
  };
}

export interface IntroLine {
  korean: string;
  meaning: string;
}

const englishOf = (list: Choice[], korean: string) =>
  list.find((c) => c.korean === korean)?.english ?? korean;

/**
 * "X is Y" in the chosen style. In the 해요 style the particle depends on Y's last
 * sound; when that is unknown (Latin letters) the 입니다 form is used, which fits both.
 */
function isLine(subject: string, noun: string, style: IntroStyle): string {
  const polite = style === 'polite' ? withParticle(noun, 'copula') : null;
  return `${subject}${polite ?? `${noun}입니다`}.`;
}

/** The introduction, one sentence per line. Lines with missing details are left out. */
export function buildIntro(details: IntroDetails, style: IntroStyle): IntroLine[] {
  const formal = style === 'formal';
  const lines: IntroLine[] = [];
  const add = (korean: string, meaning: string) => lines.push({ korean, meaning });

  add('안녕하세요.', 'Hello.');
  if (formal) add('처음 뵙겠습니다.', 'Nice to meet you.');

  const name = details.name.trim();
  if (name) add(isLine('저는 ', name, style), `I'm ${name}.`);

  const country = details.country.trim();
  if (country) {
    add(
      `${country}에서 ${formal ? '왔습니다' : '왔어요'}.`,
      `I'm from ${englishOf(COUNTRIES, country)}.`,
    );
  }

  const university = details.university.trim();
  if (university) {
    const role = details.exchange ? '교환학생' : '학생';
    add(
      `저는 ${university} ${role}${formal ? '입니다' : '이에요'}.`,
      `I'm ${details.exchange ? 'an exchange student' : 'a student'} at ${
        university === '유니스트' ? 'UNIST' : university
      }.`,
    );
  }

  const major = details.major.trim();
  if (major) add(isLine('제 전공은 ', major, style), `My major is ${englishOf(MAJORS, major)}.`);

  const hobbies = details.hobbies
    .map((h) => h.trim())
    .filter(Boolean)
    .slice(0, MAX_HOBBIES);
  if (hobbies.length > 0) {
    // Two hobbies are joined with 과 / 와 ("and"), chosen by the first one's last sound.
    const joiner = hobbies.length === 2 ? particleFor(hobbies[0]!, 'and') : null;
    const korean =
      hobbies.length === 2 && joiner ? `${hobbies[0]}${joiner} ${hobbies[1]}` : hobbies.join(', ');
    const english = hobbies.map((h) => englishOf(HOBBIES, h)).join(' and ');
    add(
      isLine('제 취미는 ', korean, style),
      `My ${hobbies.length === 1 ? 'hobby is' : 'hobbies are'} ${english}.`,
    );
  }

  add(formal ? '만나서 반갑습니다.' : '만나서 반가워요.', 'Nice to meet you.');
  add(formal ? '잘 부탁드립니다.' : '잘 부탁드려요.', 'I look forward to getting to know you.');
  return lines;
}

/** True when a detail cannot take a 해요-style particle (it does not end in Hangul). */
export function needsHangul(value: string): boolean {
  return value.trim() !== '' && particleFor(value, 'copula') === null;
}
