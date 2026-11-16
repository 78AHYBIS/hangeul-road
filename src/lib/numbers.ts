/** Korean number readings: Sino-Korean, native Korean, prices, clock times, phone numbers. */

const SINO_DIGITS = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
const SINO_UNITS = ['천', '백', '십', ''];

function sinoUnder10000(n: number): string {
  const digits = String(n).padStart(4, '0').split('').map(Number);
  return digits
    .map((digit, i) => {
      if (digit === 0) return '';
      const unit = SINO_UNITS[i]!;
      // 일 is dropped before 십, 백 and 천: 10 is 십, not 일십.
      return (digit === 1 && unit !== '' ? '' : SINO_DIGITS[digit]!) + unit;
    })
    .join('');
}

/** Sino-Korean reading for 0 to 99,999,999, e.g. 15000 -> '만 오천'. */
export function sino(n: number): string {
  if (n === 0) return '영';
  const man = Math.floor(n / 10000);
  const rest = n % 10000;
  const parts: string[] = [];
  // 10,000 is read 만 (not 일만).
  if (man > 0) parts.push((man === 1 ? '' : sinoUnder10000(man)) + '만');
  if (rest > 0) parts.push(sinoUnder10000(rest));
  return parts.join(' ');
}

const NATIVE_ONES = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
const NATIVE_TENS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];
// Before a counter (시, 개, 명...) these five change form.
const COUNTER_ONES = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'];

/** Native Korean number for 1 to 99, e.g. 21 -> '스물하나'. */
export function native(n: number): string {
  return NATIVE_TENS[Math.floor(n / 10)]! + NATIVE_ONES[n % 10]!;
}

/** Native Korean number as used before a counter, e.g. 1 -> '한', 20 -> '스무'. */
export function nativeCounter(n: number): string {
  if (n === 20) return '스무';
  return NATIVE_TENS[Math.floor(n / 10)]! + COUNTER_ONES[n % 10]!;
}

/** Clock time: native hours, Sino minutes. (3, 20) -> '세 시 이십 분'. */
export function clockTime(hour: number, minute: number): string {
  return `${nativeCounter(hour)} 시` + (minute > 0 ? ` ${sino(minute)} 분` : '');
}

/** Price in won, e.g. 4500 -> '사천오백 원'. */
export function price(won: number): string {
  return `${sino(won)} 원`;
}

/** Phone number read digit by digit; 0 is 공. '010-1234-5678' -> '공일공 일이삼사 오육칠팔'. */
export function phoneNumber(number: string): string {
  return number
    .split('-')
    .map((group) =>
      group
        .split('')
        .map((d) => (d === '0' ? '공' : SINO_DIGITS[Number(d)]!))
        .join(''),
    )
    .join(' ');
}
