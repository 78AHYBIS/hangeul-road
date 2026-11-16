import { useState } from 'react';
import { Card, Page } from '../../components/Page';
import { btnPrimary, btnSecondary, muted } from '../../components/ui';
import { speak } from '../../lib/speech';
import { useAppStore } from '../../lib/storage/store';
import { SpeakButton, VoiceNotice } from '../hangul/shared';
import {
  NUMBER_MODES,
  NUMBER_MODE_INFO,
  buildNumberSession,
  type NumberMode,
  type NumberQuestion,
} from './numberDrill';

const BACK = { to: '/learn/vocab', label: 'Vocabulary' };

export function NumbersPage() {
  const rate = useAppStore((s) => s.settings.speechRate);
  const [mode, setMode] = useState<NumberMode>('sino');
  const [session, setSession] = useState<NumberQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  function start(nextMode: NumberMode) {
    setMode(nextMode);
    setSession(buildNumberSession(nextMode));
    setIndex(0);
    setPicked(null);
    setScore(0);
  }

  if (!session) {
    return (
      <Page
        title="Number trainer"
        subtitle="Korean has two number systems. You need both every day."
        back={BACK}
      >
        <VoiceNotice />
        <Card>
          <ul className="divide-y divide-stone-200 dark:divide-stone-800">
            {NUMBER_MODES.map((m) => (
              <li key={m}>
                <button
                  type="button"
                  onClick={() => start(m)}
                  className="flex min-h-14 w-full items-center justify-between gap-3 py-2 text-left"
                >
                  <span>
                    <span className="block font-medium">{NUMBER_MODE_INFO[m].title}</span>
                    <span className={`block ${muted}`} lang="ko">
                      {NUMBER_MODE_INFO[m].hint}
                    </span>
                  </span>
                  <span className="text-teal-700 dark:text-teal-400" aria-hidden="true">
                    ›
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </Page>
    );
  }

  const question = session[index];
  if (!question) {
    return (
      <Page title={NUMBER_MODE_INFO[mode].title} back={BACK}>
        <Card>
          <p className={muted}>Finished</p>
          <p className="mt-1 text-4xl font-bold" data-testid="score">
            {score} / {session.length}
          </p>
          <div className="mt-4 flex gap-3">
            <button type="button" className={`${btnPrimary} flex-1`} onClick={() => start(mode)}>
              Again
            </button>
            <button
              type="button"
              className={`${btnSecondary} flex-1`}
              onClick={() => setSession(null)}
            >
              Other numbers
            </button>
          </div>
        </Card>
      </Page>
    );
  }

  const answered = picked !== null;
  return (
    <Page
      title={NUMBER_MODE_INFO[mode].title}
      subtitle={`Question ${index + 1} of ${session.length}`}
      back={BACK}
    >
      <Card>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <p
            className="text-4xl font-semibold"
            lang={question.promptIsKorean ? 'ko' : undefined}
            data-testid="prompt"
          >
            {question.prompt}
          </p>
          {(question.promptIsKorean || answered) && <SpeakButton text={question.speak} />}
        </div>
      </Card>
      <div className="grid gap-3">
        {question.options.map((option) => {
          const isAnswer = option === question.answer;
          const style = !answered
            ? 'border-stone-300 dark:border-stone-700'
            : isAnswer
              ? 'border-teal-700 bg-teal-700 text-white'
              : option === picked
                ? 'border-amber-500 bg-amber-100 text-amber-950 dark:bg-amber-900 dark:text-amber-50'
                : 'border-stone-200 opacity-50 dark:border-stone-800';
          return (
            <button
              key={option}
              type="button"
              disabled={answered}
              data-correct={isAnswer}
              lang={question.promptIsKorean ? undefined : 'ko'}
              onClick={() => {
                setPicked(option);
                if (isAnswer) setScore(score + 1);
                speak(question.speak, rate);
              }}
              className={`min-h-14 rounded-2xl border-2 px-3 text-xl font-medium ${style}`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {answered && (
        <button
          type="button"
          className={`${btnPrimary} w-full`}
          onClick={() => {
            setPicked(null);
            setIndex(index + 1);
          }}
        >
          Next
        </button>
      )}
    </Page>
  );
}
