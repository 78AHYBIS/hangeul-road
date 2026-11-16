/**
 * Stroke order for every letter, drawn on a 100 x 100 grid.
 * Each stroke is an SVG path that starts where the pen starts.
 * Rule of thumb: top to bottom, left to right.
 */

export interface Stroke {
  d: string;
  /** Where the pen touches down (used to place the stroke number). */
  start: [number, number];
}

const BASIC: Record<string, string[]> = {
  ㄱ: ['M20 22 H78 V82'],
  ㄴ: ['M22 18 V78 H80'],
  ㄷ: ['M20 22 H80', 'M22 22 V78 H80'],
  ㄹ: ['M20 20 H80 V50', 'M20 50 H80', 'M20 50 V80 H80'],
  ㅁ: ['M22 20 V80', 'M22 20 H78 V80', 'M22 80 H78'],
  ㅂ: ['M24 18 V82', 'M76 18 V82', 'M24 48 H76', 'M24 82 H76'],
  ㅅ: ['M52 18 L18 82', 'M41 40 L84 82'],
  ㅇ: ['M50 18 A32 32 0 1 0 50 82 A32 32 0 1 0 50 18'],
  ㅈ: ['M20 24 H78 L20 82', 'M50 52 L84 82'],
  ㅊ: ['M50 8 V20', 'M20 30 H78 L20 84', 'M50 56 L84 84'],
  ㅋ: ['M20 22 H78 V82', 'M20 50 H78'],
  ㅌ: ['M20 20 H80', 'M20 50 H80', 'M20 20 V80 H80'],
  ㅍ: ['M18 20 H82', 'M36 20 V80', 'M64 20 V80', 'M18 80 H82'],
  ㅎ: ['M50 8 V20', 'M18 30 H82', 'M50 44 A19 19 0 1 0 50 82 A19 19 0 1 0 50 44'],
  ㅏ: ['M45 12 V88', 'M45 50 H78'],
  ㅑ: ['M45 12 V88', 'M45 36 H78', 'M45 64 H78'],
  ㅓ: ['M22 50 H58', 'M58 12 V88'],
  ㅕ: ['M22 36 H58', 'M22 64 H58', 'M58 12 V88'],
  ㅗ: ['M50 22 V62', 'M12 62 H88'],
  ㅛ: ['M36 22 V62', 'M64 22 V62', 'M12 62 H88'],
  ㅜ: ['M12 40 H88', 'M50 40 V82'],
  ㅠ: ['M12 40 H88', 'M36 40 V82', 'M64 40 V82'],
  ㅡ: ['M12 50 H88'],
  ㅣ: ['M50 12 V88'],
  ㅐ: ['M35 12 V88', 'M35 50 H65', 'M65 12 V88'],
  ㅒ: ['M35 12 V88', 'M35 36 H65', 'M35 64 H65', 'M65 12 V88'],
  ㅔ: ['M18 50 H48', 'M48 12 V88', 'M72 12 V88'],
  ㅖ: ['M18 36 H48', 'M18 64 H48', 'M48 12 V88', 'M72 12 V88'],
  ㅘ: ['M35 30 V62', 'M10 62 H60', 'M70 12 V88', 'M70 50 H92'],
  ㅙ: ['M32 30 V62', 'M8 62 H56', 'M64 12 V88', 'M64 50 H82', 'M82 12 V88'],
  ㅚ: ['M38 30 V62', 'M10 62 H66', 'M78 12 V88'],
  ㅝ: ['M10 56 H62', 'M36 56 V88', 'M54 36 H76', 'M76 12 V88'],
  ㅞ: ['M8 56 H54', 'M30 56 V88', 'M46 36 H64', 'M64 12 V88', 'M84 12 V88'],
  ㅟ: ['M10 50 H66', 'M38 50 V86', 'M78 12 V88'],
  ㅢ: ['M10 62 H68', 'M80 12 V88'],
};

/** Squeezes a path horizontally and shifts it, to draw a letter in half the width. */
function squeeze(d: string, scale: number, shift: number): string {
  const x = (value: string) => String(Math.round(Number(value) * scale + shift));
  return d.replace(/([MLHV])\s*([\d.]+)(?:\s+([\d.]+))?/g, (_, command, a, b) => {
    if (command === 'V') return `V${a}`;
    if (command === 'H') return `H${x(a)}`;
    return `${command}${x(a)} ${b}`;
  });
}

/** A double consonant is the same letter written twice, left one first. */
const double = (jamo: string): string[] => [
  ...BASIC[jamo]!.map((d) => squeeze(d, 0.46, 3)),
  ...BASIC[jamo]!.map((d) => squeeze(d, 0.46, 51)),
];

const PATHS: Record<string, string[]> = {
  ...BASIC,
  ㄲ: double('ㄱ'),
  ㄸ: double('ㄷ'),
  ㅃ: double('ㅂ'),
  ㅆ: double('ㅅ'),
  ㅉ: double('ㅈ'),
};

function toStroke(d: string): Stroke {
  const match = /^M\s*([\d.]+)\s+([\d.]+)/.exec(d)!;
  return { d, start: [Number(match[1]), Number(match[2])] };
}

export const STROKES: Record<string, Stroke[]> = Object.fromEntries(
  Object.entries(PATHS).map(([jamo, paths]) => [jamo, paths.map(toStroke)]),
);
