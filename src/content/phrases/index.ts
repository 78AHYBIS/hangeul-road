/**
 * Typed access to the situation phrase packs. To add or fix a phrase, edit packs.json.
 * Phrase ids must never change once used: starred phrases are saved by id.
 */
import packsJson from './packs.json';

export interface DialogueLine {
  /** "You" is the learner; anyone else is named by role or name. */
  speaker: string;
  korean: string;
  meaning: string;
}

export interface Phrase {
  id: string;
  korean: string;
  meaning: string;
  note?: string;
  /** Casual speech (반말), shown with a clear label. */
  casual?: boolean;
}

export interface PhrasePack {
  id: string;
  title: string;
  situation: string;
  dialogue: DialogueLine[];
  phrases: Phrase[];
  /** Grammar lessons used in the pack. */
  refs?: string[];
  /** Set when the pack states a fact that can change (e.g. emergency numbers). */
  lastVerified?: string;
}

/** In study order. */
export const PHRASE_PACKS = packsJson as PhrasePack[];

export interface PhraseWithPack extends Phrase {
  packId: string;
  packTitle: string;
}

export const ALL_PHRASES: PhraseWithPack[] = PHRASE_PACKS.flatMap((pack) =>
  pack.phrases.map((p) => ({ ...p, packId: pack.id, packTitle: pack.title })),
);

export function findPack(id: string | undefined): PhrasePack | undefined {
  return PHRASE_PACKS.find((p) => p.id === id);
}
