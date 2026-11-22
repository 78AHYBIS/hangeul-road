import { describe, expect, it } from 'vitest';
import {
  LETTERS,
  LETTER_BY_JAMO,
  LETTER_LESSONS,
  LOOKALIKE_GROUPS,
  READING_WORDS,
  RULE_LESSONS,
} from '../../content/hangul';
import { STROKES } from '../../content/hangul/strokes';
import { INITIALS, MEDIALS, decompose, lettersIn, toKeystrokes } from '../../lib/hangul';
import { EMPTY_HANGUL_PROGRESS, recordLetterResults } from '../../lib/hangulProgress';
import { DRILL_TYPES, buildSession, buildTimedItems, drillPool } from './drills';

/** A repeatable random number generator, so tests give the same result every run. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

describe('hangul content', () => {
  const inGroup = (group: string) => LETTERS.filter((l) => l.group === group).length;

  it('covers all 40 letters', () => {
    expect(LETTERS).toHaveLength(40);
    expect(inGroup('basic-consonants') + inGroup('aspirated-consonants')).toBe(14);
    expect(inGroup('double-consonants')).toBe(5);
    expect(inGroup('basic-vowels')).toBe(10);
    expect(inGroup('compound-vowels')).toBe(11);
    // Exactly the letters Unicode defines as initials and vowels.
    expect(new Set(LETTERS.map((l) => l.korean))).toEqual(new Set([...INITIALS, ...MEDIALS]));
  });

  it('gives every letter a unique sound label, a spoken syllable and valid look-alikes', () => {
    expect(new Set(LETTERS.map((l) => l.sound)).size).toBe(40);
    for (const letter of LETTERS) {
      const spoken = decompose(letter.speak);
      expect(spoken, letter.korean).not.toBeNull();
      expect([spoken!.initial, spoken!.medial], letter.korean).toContain(letter.korean);
      for (const other of letter.confusedWith) {
        expect(LETTER_BY_JAMO.has(other), `${letter.korean} -> ${other}`).toBe(true);
        expect(other).not.toBe(letter.korean);
      }
    }
    for (const jamo of LOOKALIKE_GROUPS.flat()) expect(LETTER_BY_JAMO.has(jamo)).toBe(true);
  });

  it('has stroke order for every letter', () => {
    for (const letter of LETTERS) {
      expect(STROKES[letter.korean]?.length, letter.korean).toBeGreaterThan(0);
    }
    expect(STROKES['ㄱ']).toHaveLength(1);
    expect(STROKES['ㅂ']).toHaveLength(4);
    expect(STROKES['ㄹ']).toHaveLength(3);
    expect(STROKES['ㅃ']).toHaveLength(8);
    expect(STROKES['ㅙ']).toHaveLength(5);
  });

  it('has one lesson per letter group, batchim and the sound-change rules', () => {
    expect(LETTER_LESSONS).toHaveLength(5);
    for (const lesson of LETTER_LESSONS) expect(inGroup(lesson.group)).toBeGreaterThan(0);
    expect(RULE_LESSONS.map((r) => r.id)).toEqual([
      'hangul-rule-batchim',
      'hangul-rule-seven-finals',
      'hangul-rule-linking',
      'hangul-rule-nasalization',
      'hangul-rule-tensing',
      'hangul-rule-aspiration',
      'hangul-rule-palatalization',
    ]);
  });

  it('includes the required real-world words, all typeable', () => {
    const words = READING_WORDS.map((w) => w.korean);
    for (const word of ['커피', '버스', '택시', '인터넷', '울산', '유니스트']) {
      expect(words).toContain(word);
    }
    for (const word of READING_WORDS) {
      expect(toKeystrokes(word.korean).length, word.korean).toBe([...word.korean].length);
      expect(word.romanization).toMatch(/^[a-z]+$/);
    }
  });
});

describe('drill sessions', () => {
  it('builds valid questions for every drill type', () => {
    for (const type of DRILL_TYPES) {
      const session = buildSession(type, EMPTY_HANGUL_PROGRESS, 10, seeded(7));
      expect(session, type).toHaveLength(10);
      for (const q of session) {
        expect(q.letters.length).toBeGreaterThan(0);
        for (const jamo of q.letters)
          expect(LETTER_BY_JAMO.has(jamo), `${type} ${jamo}`).toBe(true);
        if (q.kind === 'choice') {
          expect(q.options).toContain(q.answer);
          expect(new Set(q.options).size).toBe(q.options.length);
          expect(q.options.length).toBeGreaterThanOrEqual(2);
        } else {
          expect(lettersIn(q.text).length).toBeGreaterThan(0);
          expect(q.romanization).not.toBe('');
        }
      }
    }
  });

  it('never asks the same letter twice in a row', () => {
    const session = buildSession('letter-sound', EMPTY_HANGUL_PROGRESS, 40, seeded(3));
    session.forEach((q, i) => {
      if (i > 0) expect(q.letters).not.toEqual(session[i - 1]!.letters);
    });
  });

  it('limits drills to finished lessons, once there are enough letters', () => {
    expect(drillPool(EMPTY_HANGUL_PROGRESS)).toHaveLength(40);
    const progress = { ...EMPTY_HANGUL_PROGRESS, lessonsDone: ['hangul-lesson-basic-vowels'] };
    expect(drillPool(progress)).toHaveLength(10);
    const session = buildSession('letter-sound', progress, 30, seeded(5));
    for (const q of session) {
      expect(LETTER_BY_JAMO.get(q.letters[0]!)!.group).toBe('basic-vowels');
    }
    // Vowels only: syllables use the silent ㅇ.
    for (const item of buildTimedItems(progress, 30, seeded(9))) {
      expect(decompose(item)!.initial).toBe('ㅇ');
    }
  });

  it('asks weak letters more often than solid ones', () => {
    let progress = { ...EMPTY_HANGUL_PROGRESS, lessonsDone: ['hangul-lesson-basic-vowels'] };
    for (const letter of LETTERS.filter((l) => l.group === 'basic-vowels')) {
      if (letter.korean === 'ㅓ') continue; // stays new
      for (let i = 0; i < 6; i++) progress = recordLetterResults(progress, [letter.korean], true);
    }
    const session = buildSession('letter-sound', progress, 300, seeded(11));
    const hard = session.filter((q) => q.letters[0] === 'ㅓ').length;
    const easy = session.filter((q) => q.letters[0] === 'ㅏ').length;
    expect(hard).toBeGreaterThan(easy * 1.5);
  });
});
