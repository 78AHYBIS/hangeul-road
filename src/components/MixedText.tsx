import { splitKorean } from '../lib/mixedText';

/**
 * Renders a string that mixes English and Korean. Each Korean run is wrapped in
 * `<span lang="ko">`, so Korean words stay whole when the line wraps.
 */
export function MixedText({ text }: { text: string }) {
  return (
    <>
      {splitKorean(text).map((run, i) =>
        run.korean ? (
          <span key={i} lang="ko">
            {run.text}
          </span>
        ) : (
          run.text
        ),
      )}
    </>
  );
}
