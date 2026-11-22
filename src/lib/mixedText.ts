/**
 * Splitting mixed English / Korean strings so the Korean parts can be marked
 * `lang="ko"`. `index.css` sets `word-break: keep-all` on `[lang='ko']`, which keeps
 * Korean words whole when a line wraps (매워요, not 매워 / 요).
 */

export interface TextRun {
  text: string;
  korean: boolean;
}

/**
 * A Korean run starts and ends with Hangul. In between it may hold spaces,
 * punctuation and digits (anything that is not a letter of another script), so
 * "이에요 / 예요" stays one run. Digits written straight before Hangul belong to
 * the run too (3시), so they do not break off either.
 */
const KOREAN_RUN = /\p{N}*\p{Script=Hangul}+(?:[^\p{L}\p{M}]*?\p{Script=Hangul}+)*/gu;

/** Splits `text` into alternating Korean and non-Korean runs, in order. */
export function splitKorean(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let last = 0;
  for (const match of text.matchAll(KOREAN_RUN)) {
    const start = match.index;
    if (start > last) runs.push({ text: text.slice(last, start), korean: false });
    runs.push({ text: match[0], korean: true });
    last = start + match[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last), korean: false });
  return runs;
}
