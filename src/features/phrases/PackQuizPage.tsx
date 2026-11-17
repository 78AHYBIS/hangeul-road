import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { btnPrimary, btnSecondary, choiceClass, muted } from '../../components/ui';
import { PHRASE_PACKS, findPack, type PhrasePack } from '../../content/phrases';
import { speak } from '../../lib/speech';
import { useAppStore } from '../../lib/storage/store';
import { SpeakButton, VoiceNotice } from '../hangul/shared';
import { useKoreanVoice } from '../hangul/useKoreanVoice';
import { buildQuiz, quizMessage, type QuizQuestion } from './quiz';

const PROMPT: Record<QuizQuestion['kind'], string> = {
  'meaning-ko': 'How do you say this in Korean?',
  'ko-meaning': 'What does this mean?',
  listen: 'Listen. What does it mean?',
};

export function PackQuizPage() {
  const { id } = useParams();
  const pack = findPack(id);
  if (!pack) return <Navigate to="/learn/phrases" replace />;
  return <Quiz key={pack.id} pack={pack} />;
}

function Quiz({ pack }: { pack: PhrasePack }) {
  const voice = useKoreanVoice();
  const rate = useAppStore((s) => s.settings.speechRate);
  const logDrill = useAppStore((s) => s.logDrill);
  const finish = useAppStore((s) => s.finishPackQuiz);
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const back = { to: `/learn/phrases/${pack.id}`, label: pack.title };

  // Listening questions play their audio as soon as they appear.
  const autoPlay = (q: QuizQuestion | undefined) => {
    if (q?.kind === 'listen') speak(q.phrase.korean, rate);
  };

  function start() {
    const quiz = buildQuiz(pack, Math.random, { listening: voice === 'available' });
    setQuestions(quiz);
    setIndex(0);
    setPicked(null);
    setScore(0);
    autoPlay(quiz[0]);
  }

  function next() {
    if (!questions) return;
    if (index + 1 === questions.length) void finish(pack.id, score, questions.length);
    setPicked(null);
    setIndex(index + 1);
    autoPlay(questions[index + 1]);
  }

  if (!questions) {
    return (
      <Page title="Quiz" subtitle={pack.title} back={back}>
        <VoiceNotice />
        <Card>
          <p className="leading-relaxed">
            Six quick questions on the key phrases of this pack.
            {voice === 'available' && ' Some are listening questions.'}
          </p>
          <p className={`mt-2 ${muted}`}>Finishing the quiz marks the pack as done.</p>
          <button type="button" className={`${btnPrimary} mt-4 w-full`} onClick={start}>
            Start
          </button>
        </Card>
      </Page>
    );
  }

  const question = questions[index];
  if (!question) {
    const nextPack = PHRASE_PACKS[PHRASE_PACKS.indexOf(pack) + 1];
    return (
      <Page title="Quiz" subtitle={pack.title} back={back}>
        <Card>
          <p className={muted}>Pack done</p>
          <p className="mt-1 text-4xl font-bold" data-testid="score">
            {score} / {questions.length}
          </p>
          <p className={`mt-2 ${muted}`}>{quizMessage(score, questions.length)}</p>
          <div className="mt-4 grid gap-3">
            {nextPack && (
              <Link
                to={`/learn/phrases/${nextPack.id}`}
                className={`${btnPrimary} flex items-center justify-center`}
              >
                Next pack: {nextPack.title}
              </Link>
            )}
            <div className="flex gap-3">
              <button type="button" className={`${btnSecondary} flex-1`} onClick={start}>
                Again
              </button>
              <Link
                to="/learn/phrases"
                className={`${btnSecondary} flex flex-1 items-center justify-center`}
              >
                All packs
              </Link>
            </div>
          </div>
        </Card>
      </Page>
    );
  }

  const answered = picked !== null;
  const koreanOptions = question.kind === 'meaning-ko';
  const { phrase } = question;

  return (
    <Page title="Quiz" subtitle={`Question ${index + 1} of ${questions.length}`} back={back}>
      <VoiceNotice />
      <Card>
        <p className={muted}>{PROMPT[question.kind]}</p>
        <div className="mt-2 flex flex-col items-center gap-3 py-2 text-center">
          {question.kind === 'meaning-ko' && (
            <p className="text-2xl font-semibold" data-testid="prompt">
              {phrase.meaning}
            </p>
          )}
          {question.kind === 'ko-meaning' && (
            <p className="text-3xl" lang="ko" data-testid="prompt">
              {phrase.korean}
            </p>
          )}
          {question.kind === 'listen' && answered && (
            <p className="text-3xl" lang="ko" data-testid="prompt">
              {phrase.korean}
            </p>
          )}
          {(question.kind === 'listen' || answered) && (
            <SpeakButton text={phrase.korean} label={answered ? 'Play' : 'Play again'} />
          )}
        </div>
      </Card>
      <div className="grid gap-3">
        {question.options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={answered}
            lang={koreanOptions ? 'ko' : undefined}
            data-correct={option.id === phrase.id}
            onClick={() => {
              setPicked(option.id);
              const correct = option.id === phrase.id;
              if (correct) setScore(score + 1);
              void logDrill(correct);
              if (question.kind !== 'listen') speak(phrase.korean, rate);
            }}
            className={`min-h-14 rounded-2xl border-2 px-3 py-2 text-left font-medium ${
              koreanOptions ? 'text-xl' : ''
            } ${choiceClass(answered, option.id === phrase.id, option.id === picked)}`}
          >
            {koreanOptions ? option.korean : option.meaning}
          </button>
        ))}
      </div>
      {answered && (
        <>
          <p role="status" className="text-center font-medium">
            {picked === phrase.id ? 'Correct' : 'The right answer is highlighted.'}
          </p>
          <button type="button" className={`${btnPrimary} w-full`} onClick={next}>
            Next
          </button>
        </>
      )}
    </Page>
  );
}
