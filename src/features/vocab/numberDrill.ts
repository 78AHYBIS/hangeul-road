/** Question generator for the number trainer. Randomness is passed in for tests. */
import { clockTime, native, phoneNumber, price, sino } from '../../lib/numbers';

export const NUMBER_MODES = ['sino', 'native', 'price', 'time', 'phone'] as const;
export type NumberMode = (typeof NUMBER_MODES)[number];

export const NUMBER_MODE_INFO: Record<NumberMode, { title: string; hint: string }> = {
  sino: { title: 'Sino-Korean', hint: '일, 이, 삼: dates, money, minutes, floors.' },
  native: { title: 'Native Korean', hint: '하나, 둘, 셋: counting, hours, age.' },
  price: { title: 'Prices', hint: 'Amounts in won.' },
  time: { title: 'Time', hint: 'Native hours with Sino-Korean minutes.' },
  phone: { title: 'Phone numbers', hint: 'Digit by digit, with 공 for zero.' },
};

export interface NumberQuestion {
  prompt: string;
  /** Korean reading, used for audio. */
  speak: string;
  promptIsKorean: boolean;
  options: string[];
  answer: string;
}

type Rng = () => number;
const int = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));

/** One random value as [how it is written with digits, how it is read in Korean]. */
function randomValue(mode: NumberMode, rng: Rng): [string, string] {
  if (mode === 'sino') {
    const roll = rng();
    const n =
      roll < 0.5 ? int(rng, 1, 99) : roll < 0.8 ? int(rng, 100, 9999) : int(rng, 10, 99) * 1000;
    return [n.toLocaleString('en-US'), sino(n)];
  }
  if (mode === 'native') {
    const n = int(rng, 1, 99);
    return [String(n), native(n)];
  }
  if (mode === 'price') {
    const n = rng() < 0.6 ? int(rng, 5, 99) * 100 : int(rng, 10, 99) * 1000;
    return [`${n.toLocaleString('en-US')}원`, price(n)];
  }
  if (mode === 'time') {
    const hour = int(rng, 1, 12);
    const minute = int(rng, 0, 11) * 5;
    return [`${hour}:${String(minute).padStart(2, '0')}`, clockTime(hour, minute)];
  }
  const digits = `010-${int(rng, 1000, 9999)}-${int(rng, 1000, 9999)}`;
  return [digits, phoneNumber(digits)];
}

export function buildNumberSession(
  mode: NumberMode,
  count = 10,
  rng: Rng = Math.random,
): NumberQuestion[] {
  const questions: NumberQuestion[] = [];
  for (let n = 0; n < count; n++) {
    const values = new Map<string, string>();
    // Four different values: the first is the answer, the rest are wrong options.
    while (values.size < 4) {
      const [digits, korean] = randomValue(mode, rng);
      values.set(digits, korean);
    }
    const entries = [...values.entries()];
    const [digits, korean] = entries[0]!;
    // Alternate direction: read Korean -> pick digits, then digits -> pick Korean.
    const promptIsKorean = n % 2 === 1;
    const options = entries.map(([d, k]) => (promptIsKorean ? d : k)).sort(() => rng() - 0.5);
    questions.push({
      prompt: promptIsKorean ? korean : digits,
      speak: korean,
      promptIsKorean,
      options,
      answer: promptIsKorean ? digits : korean,
    });
  }
  return questions;
}
