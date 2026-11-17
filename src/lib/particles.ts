/**
 * Choosing the right particle form. Korean particles have two forms, picked by
 * whether the word before them ends in a consonant (a batchim) or a vowel:
 * 학생이에요 / 의사예요, 책은 / 저는, 물이 / 비가, 밥을 / 커피를, 책과 / 커피와.
 */
import { decompose } from './hangul';

// How each digit is read (Sino-Korean), so that "2층" or "305호" work too.
const DIGIT_HAS_FINAL = [true, true, false, true, false, false, true, true, true, false];
const DIGIT_FINAL_IS_L = [false, true, false, false, false, false, false, true, true, false];

/** The last letter that matters: a Hangul syllable or a digit, skipping spaces and punctuation. */
function lastSound(word: string): { hasFinal: boolean; finalIsL: boolean } | null {
  const chars = [...word.trim()].filter((c) => !/[\s.,!?'"()]/.test(c));
  const last = chars[chars.length - 1];
  if (!last) return null;
  if (/[0-9]/.test(last)) {
    const d = Number(last);
    return { hasFinal: DIGIT_HAS_FINAL[d]!, finalIsL: DIGIT_FINAL_IS_L[d]! };
  }
  const parts = decompose(last);
  if (!parts) return null;
  return { hasFinal: parts.final !== '', finalIsL: parts.final === 'ㄹ' };
}

/**
 * True if the word ends in a consonant sound, false if in a vowel, and null when the
 * app cannot tell (for example a name written in Latin letters).
 */
export function endsInConsonant(word: string): boolean | null {
  return lastSound(word)?.hasFinal ?? null;
}

export type ParticlePair = 'copula' | 'topic' | 'subject' | 'object' | 'and' | 'with';

/** [after a consonant, after a vowel] */
const FORMS: Record<ParticlePair, [string, string]> = {
  copula: ['이에요', '예요'],
  topic: ['은', '는'],
  subject: ['이', '가'],
  object: ['을', '를'],
  and: ['과', '와'],
  // (으)로 "by / to": 로 after a vowel or after ㄹ, 으로 after any other consonant.
  with: ['으로', '로'],
};

/** The right particle for a word, or null if the word's last sound is unknown. */
export function particleFor(word: string, pair: ParticlePair): string | null {
  const sound = lastSound(word);
  if (!sound) return null;
  if (pair === 'with' && sound.finalIsL) return '로';
  const [afterConsonant, afterVowel] = FORMS[pair];
  return sound.hasFinal ? afterConsonant : afterVowel;
}

/** Word plus its particle: withParticle('학생', 'copula') -> '학생이에요'. */
export function withParticle(word: string, pair: ParticlePair): string | null {
  const particle = particleFor(word, pair);
  return particle === null ? null : `${word.trim()}${particle}`;
}
