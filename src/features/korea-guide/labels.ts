/** Display labels for the access fields of an app. */
import type {
  CardSupport,
  EnglishSupport,
  KoreaApp,
  Need,
  SetupWhen,
} from '../../content/korea-apps';

export const ENGLISH_LABEL: Record<EnglishSupport, string> = {
  yes: 'Yes',
  partial: 'Partly',
  no: 'Korean only',
  unconfirmed: 'Unconfirmed',
};

export const NUMBER_LABEL: Record<Need, string> = {
  no: 'Not needed',
  some: 'Only for some features',
  yes: 'Needed',
  unconfirmed: 'Unconfirmed',
};

export const CARD_LABEL: Record<CardSupport, string> = {
  yes: 'Work',
  some: 'Sometimes work',
  no: 'Korean cards only',
  none: 'No payments in the app',
  unconfirmed: 'Unconfirmed',
};

export const SETUP_LABEL: Record<SetupWhen, string> = {
  before: 'Set up before you fly',
  arrival: 'Set up after you arrive',
  arc: 'Set up after your ARC',
};

/** Short chips for list rows: the three facts that decide whether it works for you now. */
export function accessChips(app: KoreaApp): string[] {
  const chips = [
    app.english === 'yes' ? 'English' : app.english === 'partial' ? 'Some English' : null,
    app.koreanNumber === 'no'
      ? 'No Korean number'
      : app.koreanNumber === 'yes'
        ? 'Korean number'
        : null,
    app.arc === 'yes' ? 'ARC' : null,
    app.disputed ? 'Sources disagree' : null,
  ];
  return chips.filter((c): c is string => c !== null);
}
