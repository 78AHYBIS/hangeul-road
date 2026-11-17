/** Phrase pack quizzes, built from the pack's phrases. Pure; randomness passed in. */
import type { Phrase, PhrasePack } from '../../content/phrases';
import { shuffle, type Rng } from '../hangul/drills';

export type QuizKind = 'meaning-ko' | 'ko-meaning' | 'listen';

export interface QuizQuestion {
  kind: QuizKind;
  phrase: Phrase;
  /** Four phrases (or fewer in a tiny pack), one of them `phrase`, shuffled. */
  options: Phrase[];
}

export const QUIZ_LENGTH = 6;

/** Phrases you mostly hear (staff questions) are asked from Korean, not produced. */
const isHeard = (p: Phrase) => p.meaning.includes('you will hear');

export function buildQuiz(
  pack: PhrasePack,
  rng: Rng,
  options: { listening: boolean; length?: number } = { listening: false },
): QuizQuestion[] {
  const length = Math.min(options.length ?? QUIZ_LENGTH, pack.phrases.length);
  const picked = shuffle(pack.phrases, rng).slice(0, length);
  const cycle: QuizKind[] = [
    'meaning-ko',
    'ko-meaning',
    options.listening ? 'listen' : 'meaning-ko',
  ];
  return picked.map((phrase, i) => {
    let kind = cycle[i % cycle.length]!;
    if (kind === 'meaning-ko' && isHeard(phrase)) kind = 'ko-meaning';
    const others = shuffle(
      pack.phrases.filter((p) => p.id !== phrase.id && p.meaning !== phrase.meaning),
      rng,
    ).slice(0, 3);
    return { kind, phrase, options: shuffle([phrase, ...others], rng) };
  });
}

/** A calm closing line. Any score finishes the pack; there is no pass mark. */
export function quizMessage(correct: number, total: number): string {
  if (total === 0) return '';
  const share = correct / total;
  if (share === 1) return 'All correct.';
  if (share >= 0.7) return 'Well done.';
  return 'A good start. Read the phrases once more and try again whenever you like.';
}
