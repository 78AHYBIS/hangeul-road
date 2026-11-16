import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { btnPrimary, btnSecondary, muted } from '../../components/ui';
import { speak } from '../../lib/speech';
import { useAppStore } from '../../lib/storage/store';
import { DRILL_INFO, DRILL_TYPES, buildSession, type DrillType, type Question } from './drills';
import { Romanization, SpeakButton, VoiceNotice } from './shared';

const BACK = { to: '/learn/hangul', label: 'Hangul' };

export function DrillPage() {
  const { type } = useParams();
  if (!DRILL_TYPES.includes(type as DrillType)) return <Navigate to="/learn/hangul" replace />;
  // `key` gives each drill type its own fresh state.
  return <Drill key={type} type={type as DrillType} />;
}

function Drill({ type }: { type: DrillType }) {
  const info = DRILL_INFO[type];
  const hangul = useAppStore((s) => s.hangul);
  const rate = useAppStore((s) => s.settings.speechRate);
  const recordLetters = useAppStore((s) => s.recordLetters);

  const [session, setSession] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);

  // Sound-first questions play their audio as soon as they appear.
  const autoPlay = (question: Question | undefined) => {
    if (question?.kind === 'choice' && !question.promptIsKorean) speak(question.speak, rate);
  };

  function start() {
    const questions = buildSession(type, hangul);
    setSession(questions);
    setIndex(0);
    setPicked(null);
    setRevealed(false);
    setScore(0);
    autoPlay(questions[0]);
  }

  function answer(question: Question, correct: boolean) {
    if (correct) setScore(score + 1);
    void recordLetters(question.letters, correct);
  }

  function next() {
    setPicked(null);
    setRevealed(false);
    setIndex(index + 1);
    autoPlay(session?.[index + 1]);
  }

  if (!session) {
    return (
      <Page title={info.title} back={BACK}>
        <VoiceNotice />
        <Card>
          <p className="leading-relaxed">{info.intro}</p>
          <p className={`mt-2 ${muted}`}>10 questions. Letters you find hard come up more often.</p>
          <button type="button" className={`${btnPrimary} mt-4 w-full`} onClick={start}>
            Start
          </button>
        </Card>
      </Page>
    );
  }

  const question = session[index];
  if (!question) {
    return (
      <Page title={info.title} back={BACK}>
        <Card>
          <p className={muted}>Session finished</p>
          <p className="mt-1 text-4xl font-bold" data-testid="score">
            {score} / {session.length}
          </p>
          <p className={`mt-2 ${muted}`}>Your progress map has been updated.</p>
          <div className="mt-4 flex gap-3">
            <button type="button" className={`${btnPrimary} flex-1`} onClick={start}>
              Again
            </button>
            <Link
              to="/learn/hangul"
              className={`${btnSecondary} flex flex-1 items-center justify-center`}
            >
              Done
            </Link>
          </div>
        </Card>
      </Page>
    );
  }

  const progressLabel = `Question ${index + 1} of ${session.length}`;

  if (question.kind === 'choice') {
    const answered = picked !== null;
    return (
      <Page title={info.title} subtitle={progressLabel} back={BACK}>
        <Card>
          <div className="flex flex-col items-center gap-3 py-2">
            <p
              className={
                question.promptIsKorean ? 'text-8xl leading-none' : 'text-5xl font-semibold'
              }
              lang={question.promptIsKorean ? 'ko' : undefined}
              data-testid="prompt"
            >
              {question.prompt}
            </p>
            {(!question.promptIsKorean || answered) && <SpeakButton text={question.speak} />}
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-3">
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
                  answer(question, isAnswer);
                  if (question.promptIsKorean) speak(question.speak, rate);
                }}
                className={`min-h-16 rounded-2xl border-2 px-2 font-medium ${style} ${
                  question.promptIsKorean ? 'text-xl' : 'text-4xl'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
        {answered && (
          <>
            <p role="status" className="text-center font-medium">
              {picked === question.answer ? 'Correct' : `The answer is ${question.answer}`}
            </p>
            <button type="button" className={`${btnPrimary} w-full`} onClick={next}>
              Next
            </button>
          </>
        )}
      </Page>
    );
  }

  return (
    <Page title={info.title} subtitle={progressLabel} back={BACK}>
      <Card>
        <div className="flex flex-col items-center gap-3 py-4">
          <p
            className={question.text.length > 3 ? 'text-5xl' : 'text-8xl leading-none'}
            lang="ko"
            data-testid="prompt"
          >
            {question.text}
          </p>
          {revealed && (
            <>
              <Romanization text={question.romanization} className="text-xl" />
              {question.meaning && <p className={muted}>{question.meaning}</p>}
              <SpeakButton text={question.text} />
            </>
          )}
        </div>
      </Card>
      {!revealed ? (
        <button
          type="button"
          className={`${btnPrimary} w-full`}
          onClick={() => {
            setRevealed(true);
            speak(question.text, rate);
          }}
        >
          I read it. Check
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            type="button"
            className={`${btnSecondary} flex-1`}
            onClick={() => {
              answer(question, false);
              next();
            }}
          >
            Missed it
          </button>
          <button
            type="button"
            className={`${btnPrimary} flex-1`}
            onClick={() => {
              answer(question, true);
              next();
            }}
          >
            Got it
          </button>
        </div>
      )}
    </Page>
  );
}
