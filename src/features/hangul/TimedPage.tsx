import { useEffect, useRef, useState } from 'react';
import { Card, Page } from '../../components/Page';
import { btnPrimary, muted } from '../../components/ui';
import { toISODate } from '../../lib/date';
import { useAppStore } from '../../lib/storage/store';
import { buildTimedItems } from './drills';

const SECONDS = 30;
const BACK = { to: '/learn/hangul', label: 'Hangul' };

export function TimedPage() {
  const hangul = useAppStore((s) => s.hangul);
  const addReadingSpeed = useAppStore((s) => s.addReadingSpeed);

  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [items, setItems] = useState<string[]>([]);
  const [count, setCount] = useState(0);
  const [endsAt, setEndsAt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(SECONDS);
  // A ref, because the timer callback needs the latest count without restarting the timer.
  const countRef = useRef(0);

  useEffect(() => {
    if (phase !== 'running') return;
    const timer = setInterval(() => {
      const left = Math.ceil((endsAt - Date.now()) / 1000);
      if (left > 0) {
        setSecondsLeft(left);
        return;
      }
      clearInterval(timer);
      setPhase('done');
      const read = countRef.current;
      void addReadingSpeed({
        date: toISODate(new Date()),
        perMinute: Math.round((read * 60) / SECONDS),
        items: read,
        seconds: SECONDS,
      });
    }, 200);
    return () => clearInterval(timer);
  }, [phase, endsAt, addReadingSpeed]);

  function start() {
    setItems(buildTimedItems(hangul));
    setCount(0);
    countRef.current = 0;
    setSecondsLeft(SECONDS);
    setEndsAt(Date.now() + SECONDS * 1000);
    setPhase('running');
  }

  function readOne() {
    countRef.current = count + 1;
    setCount(count + 1);
  }

  const history = hangul.readingSpeed.slice(-12);
  const best = Math.max(1, ...history.map((entry) => entry.perMinute));

  return (
    <Page title="Timed reading" subtitle="How many can you read aloud in 30 seconds?" back={BACK}>
      {phase === 'running' ? (
        <>
          <p className="text-center font-medium tabular-nums" role="timer">
            {secondsLeft} s left · {count} read
          </p>
          <button
            type="button"
            onClick={readOne}
            className="flex min-h-72 w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-teal-700 bg-white dark:bg-stone-900"
          >
            <span className="text-7xl" lang="ko" data-testid="timed-item">
              {items[count % items.length]}
            </span>
            <span className={muted}>Read it aloud, then tap anywhere here</span>
          </button>
        </>
      ) : (
        <Card>
          {phase === 'done' && (
            <p className="mb-3">
              <span className="text-4xl font-bold" data-testid="speed">
                {Math.round((count * 60) / SECONDS)}
              </span>{' '}
              per minute <span className={muted}>({count} read)</span>
            </p>
          )}
          <p className="leading-relaxed">
            Read each item out loud, then tap to get the next one. Only count what you really read.
          </p>
          <button type="button" className={`${btnPrimary} mt-4 w-full`} onClick={start}>
            {phase === 'done' ? 'Try again' : 'Start'}
          </button>
        </Card>
      )}

      {phase !== 'running' && (
        <Card>
          <h2 className="font-semibold">Your speed over time</h2>
          {history.length === 0 ? (
            <p className={`mt-1 ${muted}`}>Your results will appear here.</p>
          ) : (
            <ol className="mt-3 flex h-32 items-end gap-1.5" aria-label="Reading speed history">
              {history.map((entry, i) => (
                <li
                  key={i}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                  title={`${entry.date}: ${entry.perMinute} per minute`}
                >
                  <span className="text-xs tabular-nums">{entry.perMinute}</span>
                  <span
                    className="w-full rounded-t bg-teal-700"
                    style={{ height: `${Math.max(4, (entry.perMinute / best) * 75)}%` }}
                  />
                  <span className="text-[10px] text-stone-500">{entry.date.slice(5)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}
    </Page>
  );
}
