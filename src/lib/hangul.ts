/**
 * Hangul maths: building syllable blocks from letters and taking them apart.
 * Unicode stores every syllable at 0xAC00 + (initial * 21 + medial) * 28 + final.
 */

export const INITIALS = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];
export const MEDIALS = [
  'ㅏ',
  'ㅐ',
  'ㅑ',
  'ㅒ',
  'ㅓ',
  'ㅔ',
  'ㅕ',
  'ㅖ',
  'ㅗ',
  'ㅘ',
  'ㅙ',
  'ㅚ',
  'ㅛ',
  'ㅜ',
  'ㅝ',
  'ㅞ',
  'ㅟ',
  'ㅠ',
  'ㅡ',
  'ㅢ',
  'ㅣ',
];
/** Index 0 is "no final consonant". */
export const FINALS = [
  '',
  'ㄱ',
  'ㄲ',
  'ㄳ',
  'ㄴ',
  'ㄵ',
  'ㄶ',
  'ㄷ',
  'ㄹ',
  'ㄺ',
  'ㄻ',
  'ㄼ',
  'ㄽ',
  'ㄾ',
  'ㄿ',
  'ㅀ',
  'ㅁ',
  'ㅂ',
  'ㅄ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];

// Revised Romanization of a single syllable read on its own.
const ROMAN_INITIAL = [
  'g',
  'kk',
  'n',
  'd',
  'tt',
  'r',
  'm',
  'b',
  'pp',
  's',
  'ss',
  '',
  'j',
  'jj',
  'ch',
  'k',
  't',
  'p',
  'h',
];
const ROMAN_MEDIAL = [
  'a',
  'ae',
  'ya',
  'yae',
  'eo',
  'e',
  'yeo',
  'ye',
  'o',
  'wa',
  'wae',
  'oe',
  'yo',
  'u',
  'wo',
  'we',
  'wi',
  'yu',
  'eu',
  'ui',
  'i',
];
const ROMAN_FINAL = [
  '',
  'k',
  'k',
  'k',
  'n',
  'n',
  'n',
  't',
  'l',
  'k',
  'm',
  'l',
  'l',
  'l',
  'p',
  'l',
  'm',
  'p',
  'p',
  't',
  't',
  'ng',
  't',
  't',
  'k',
  't',
  'p',
  't',
];

/** Double final consonants, split into the two letters they are written with. */
export const CLUSTERS: Record<string, [string, string]> = {
  ㄳ: ['ㄱ', 'ㅅ'],
  ㄵ: ['ㄴ', 'ㅈ'],
  ㄶ: ['ㄴ', 'ㅎ'],
  ㄺ: ['ㄹ', 'ㄱ'],
  ㄻ: ['ㄹ', 'ㅁ'],
  ㄼ: ['ㄹ', 'ㅂ'],
  ㄽ: ['ㄹ', 'ㅅ'],
  ㄾ: ['ㄹ', 'ㅌ'],
  ㄿ: ['ㄹ', 'ㅍ'],
  ㅀ: ['ㄹ', 'ㅎ'],
  ㅄ: ['ㅂ', 'ㅅ'],
};

/** Compound vowels that take two key presses on a Korean keyboard. */
export const VOWEL_KEYS: Record<string, [string, string]> = {
  ㅘ: ['ㅗ', 'ㅏ'],
  ㅙ: ['ㅗ', 'ㅐ'],
  ㅚ: ['ㅗ', 'ㅣ'],
  ㅝ: ['ㅜ', 'ㅓ'],
  ㅞ: ['ㅜ', 'ㅔ'],
  ㅟ: ['ㅜ', 'ㅣ'],
  ㅢ: ['ㅡ', 'ㅣ'],
};

const BASE = 0xac00;
const LAST = 0xd7a3;

/** Builds one syllable block, e.g. compose('ㅎ', 'ㅏ', 'ㄴ') -> '한'. Returns '' if impossible. */
export function compose(initial: string, medial: string, final = ''): string {
  const i = INITIALS.indexOf(initial);
  const m = MEDIALS.indexOf(medial);
  const f = FINALS.indexOf(final);
  if (i < 0 || m < 0 || f < 0) return '';
  return String.fromCharCode(BASE + (i * 21 + m) * 28 + f);
}

export interface SyllableParts {
  initial: string;
  medial: string;
  final: string;
}

/** Splits one syllable block into its letters. Returns null for anything else. */
export function decompose(char: string): SyllableParts | null {
  const code = char.charCodeAt(0);
  if (char.length !== 1 || code < BASE || code > LAST) return null;
  const offset = code - BASE;
  return {
    initial: INITIALS[Math.floor(offset / 588)]!,
    medial: MEDIALS[Math.floor((offset % 588) / 28)]!,
    final: FINALS[offset % 28]!,
  };
}

/** Romanizes a single syllable read alone (no sound changes between syllables). */
export function romanizeSyllable(char: string): string {
  const parts = decompose(char);
  if (!parts) return '';
  return (
    ROMAN_INITIAL[INITIALS.indexOf(parts.initial)]! +
    ROMAN_MEDIAL[MEDIALS.indexOf(parts.medial)]! +
    ROMAN_FINAL[FINALS.indexOf(parts.final)]!
  );
}

/** The distinct letters (out of the 40) used to write a text. Used for per-letter stats. */
export function lettersIn(text: string): string[] {
  const found = new Set<string>();
  for (const char of text) {
    const parts = decompose(char);
    if (!parts) continue;
    found.add(parts.initial);
    found.add(parts.medial);
    if (parts.final) for (const letter of CLUSTERS[parts.final] ?? [parts.final]) found.add(letter);
  }
  return [...found];
}

// ---------- Two-set (dubeolsik) keyboard ----------

export interface KeyDef {
  /** Physical key, as in KeyboardEvent.code. */
  code: string;
  latin: string;
  jamo: string;
  /** Letter typed with Shift held, if different. */
  shift?: string;
}

const key = (latin: string, jamo: string, shift?: string): KeyDef => ({
  code: `Key${latin.toUpperCase()}`,
  latin,
  jamo,
  shift,
});

export const KEYBOARD_ROWS: KeyDef[][] = [
  [
    key('q', 'ㅂ', 'ㅃ'),
    key('w', 'ㅈ', 'ㅉ'),
    key('e', 'ㄷ', 'ㄸ'),
    key('r', 'ㄱ', 'ㄲ'),
    key('t', 'ㅅ', 'ㅆ'),
    key('y', 'ㅛ'),
    key('u', 'ㅕ'),
    key('i', 'ㅑ'),
    key('o', 'ㅐ', 'ㅒ'),
    key('p', 'ㅔ', 'ㅖ'),
  ],
  [
    key('a', 'ㅁ'),
    key('s', 'ㄴ'),
    key('d', 'ㅇ'),
    key('f', 'ㄹ'),
    key('g', 'ㅎ'),
    key('h', 'ㅗ'),
    key('j', 'ㅓ'),
    key('k', 'ㅏ'),
    key('l', 'ㅣ'),
  ],
  [
    key('z', 'ㅋ'),
    key('x', 'ㅌ'),
    key('c', 'ㅊ'),
    key('v', 'ㅍ'),
    key('b', 'ㅠ'),
    key('n', 'ㅜ'),
    key('m', 'ㅡ'),
  ],
];

const ALL_KEYS = KEYBOARD_ROWS.flat();

/** Letters that need Shift: ㅃ ㅉ ㄸ ㄲ ㅆ ㅒ ㅖ. */
export const SHIFT_JAMO = new Set(ALL_KEYS.flatMap((k) => (k.shift ? [k.shift] : [])));

/** Every letter that has its own key (with or without Shift). */
export const TYPEABLE_JAMO = ALL_KEYS.flatMap((k) => (k.shift ? [k.jamo, k.shift] : [k.jamo]));

export function jamoForKey(code: string, shift: boolean): string | null {
  const def = ALL_KEYS.find((k) => k.code === code);
  if (!def) return null;
  return shift && def.shift ? def.shift : def.jamo;
}

function keysForJamo(jamo: string): string[] {
  return VOWEL_KEYS[jamo] ?? CLUSTERS[jamo] ?? [jamo];
}

export interface CharKeys {
  char: string;
  keys: string[];
}

/** The key presses needed to type a text, one entry per character. Spaces are skipped. */
export function toKeystrokes(text: string): CharKeys[] {
  const result: CharKeys[] = [];
  for (const char of text) {
    const parts = decompose(char);
    if (parts) {
      result.push({
        char,
        keys: [
          parts.initial,
          ...keysForJamo(parts.medial),
          ...(parts.final ? keysForJamo(parts.final) : []),
        ],
      });
    } else if (INITIALS.includes(char) || MEDIALS.includes(char)) {
      result.push({ char, keys: keysForJamo(char) });
    }
  }
  return result;
}

/** What a character looks like on screen after `typed` of its key presses. */
export function composePartial(char: string, typed: number): string {
  if (typed <= 0) return '';
  const parts = decompose(char);
  if (!parts) {
    const keys = keysForJamo(char);
    return typed >= keys.length ? char : keys[0]!;
  }
  if (typed === 1) return parts.initial;
  const medialKeys = keysForJamo(parts.medial);
  const finalKeys = parts.final ? keysForJamo(parts.final) : [];
  const medialTyped = typed - 1;
  if (medialTyped < medialKeys.length) return compose(parts.initial, medialKeys[0]!);
  const finalTyped = medialTyped - medialKeys.length;
  if (finalTyped <= 0) return compose(parts.initial, parts.medial);
  if (finalTyped < finalKeys.length) return compose(parts.initial, parts.medial, finalKeys[0]!);
  return char;
}

/** The text on screen after `typed` key presses of a whole word. */
export function typedSoFar(chars: CharKeys[], typed: number): string {
  let text = '';
  for (const c of chars) {
    const used = Math.min(typed, c.keys.length);
    typed -= used;
    text += composePartial(c.char, used);
  }
  return text;
}
