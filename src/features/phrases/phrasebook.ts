/** Phrasebook search and filters. Pure, so it is easy to test. */
import { ALL_PHRASES, type PhraseWithPack } from '../../content/phrases';

export type Filter = 'all' | 'starred';

/**
 * Phrases matching the search text (Korean or English), the filter and the pack
 * ('' for all packs). Starred phrases come first, in their original order.
 */
export function filterPhrases(
  query: string,
  filter: Filter,
  packId: string,
  starred: string[],
): PhraseWithPack[] {
  const q = query.trim().toLowerCase();
  const list = ALL_PHRASES.filter(
    (p) =>
      (filter === 'all' || starred.includes(p.id)) &&
      (packId === '' || p.packId === packId) &&
      (q === '' || p.korean.includes(q) || p.meaning.toLowerCase().includes(q)),
  );
  const isStarred = (p: PhraseWithPack) => starred.includes(p.id);
  return [...list.filter(isStarred), ...list.filter((p) => !isStarred(p))];
}
