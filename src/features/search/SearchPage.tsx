import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { MixedText } from '../../components/MixedText';
import { inputClass, muted } from '../../components/ui';
import { useAppStore } from '../../lib/storage/store';
import { SpeakButton, VoiceNotice } from '../hangul/shared';
import { allResources } from '../library/resources';
import { allWords } from '../vocab/words';
import { KIND_TITLE, buildIndex, groupResults, search, type ResultKind } from './search';

const PER_GROUP = 5;

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const library = useAppStore((s) => s.library);
  const myWords = useAppStore((s) => s.vocab.myWords);
  const [expanded, setExpanded] = useState<ResultKind[]>([]);

  const index = useMemo(
    () => buildIndex({ resources: allResources(library), words: allWords(myWords) }),
    [library, myWords],
  );
  const results = useMemo(() => search(index, query), [index, query]);
  const groups = groupResults(results);

  return (
    <Page title="Search" subtitle="Words, phrases, grammar, Korea life, apps and the library.">
      <form role="search" onSubmit={(e) => e.preventDefault()}>
        <label className="block text-sm font-medium">
          Search everything
          <input
            type="search"
            // The page exists to type in this field, so focus it straight away.
            autoFocus
            enterKeyHint="search"
            className={inputClass}
            placeholder="e.g. coffee, 감사합니다, bus, KakaoTalk"
            value={query}
            onChange={(e) => {
              setExpanded([]);
              setParams(e.target.value ? { q: e.target.value } : {}, { replace: true });
            }}
          />
        </label>
      </form>

      {groups.some(([kind]) => kind === 'word' || kind === 'phrase') && <VoiceNotice />}

      {query.trim() && (
        <p className={muted} role="status">
          {results.length === 0
            ? 'Nothing found. Try a shorter word, or English instead of Korean.'
            : `${results.length} ${results.length === 1 ? 'result' : 'results'}`}
        </p>
      )}

      {groups.map(([kind, list]) => {
        const open = expanded.includes(kind);
        const shown = open ? list : list.slice(0, PER_GROUP);
        return (
          <section key={kind} aria-labelledby={`results-${kind}`} className="space-y-2">
            <h2 id={`results-${kind}`} className="font-semibold">
              {KIND_TITLE[kind]} <span className={muted}>({list.length})</span>
            </h2>
            <Card>
              <ul className="divide-y divide-stone-200 dark:divide-stone-800">
                {shown.map((r) => (
                  <li key={`${r.kind}:${r.id}`} className="flex items-center gap-2">
                    <Link to={r.to} className="block min-h-14 min-w-0 flex-1 py-2">
                      <span className="block font-medium" lang={r.speak ? 'ko' : undefined}>
                        {r.speak ? r.title : <MixedText text={r.title} />}
                      </span>
                      <span className={`line-clamp-2 block ${muted}`}>
                        <MixedText text={r.detail} />
                      </span>
                    </Link>
                    {r.speak && <SpeakButton text={r.speak} compact />}
                  </li>
                ))}
              </ul>
              {list.length > PER_GROUP && !open && (
                <button
                  type="button"
                  className="mt-1 flex min-h-10 items-center text-sm font-medium text-teal-700 dark:text-teal-400"
                  onClick={() => setExpanded([...expanded, kind])}
                >
                  Show all {list.length}
                </button>
              )}
            </Card>
          </section>
        );
      })}
    </Page>
  );
}
