import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { btnPrimary, btnSecondary, choiceClass, muted } from '../../components/ui';
import { findTopic, type CultureTopic } from '../../content/culture';
import { useAppStore } from '../../lib/storage/store';
import { quizMessage } from '../phrases/quiz';
import { buildCultureQuiz, type CultureQuestion } from './culture';
import { MixedText } from '../../components/MixedText';

export function TopicQuizPage() {
  const { id } = useParams();
  const topic = findTopic(id);
  if (!topic) return <Navigate to="/korea" replace />;
  return <Quiz key={topic.id} topic={topic} />;
}

function Quiz({ topic }: { topic: CultureTopic }) {
  const logDrill = useAppStore((s) => s.logDrill);
  const finish = useAppStore((s) => s.finishCultureQuiz);
  const [questions, setQuestions] = useState<CultureQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const back = { to: `/korea/topic/${topic.id}`, label: topic.title };

  function start() {
    setQuestions(buildCultureQuiz(topic, Math.random));
    setIndex(0);
    setPicked(null);
    setScore(0);
  }

  function next() {
    if (!questions) return;
    if (index + 1 === questions.length) void finish(topic.id, score, questions.length);
    setPicked(null);
    setIndex(index + 1);
  }

  if (!questions) {
    return (
      <Page title="Quiz" subtitle={topic.title} back={back}>
        <Card>
          <p className="leading-relaxed">
            {topic.quiz.length} quick questions on this topic. Each answer comes with a short
            reason.
          </p>
          <button type="button" className={`${btnPrimary} mt-4 w-full`} onClick={start}>
            Start
          </button>
        </Card>
      </Page>
    );
  }

  const question = questions[index];
  if (!question) {
    return (
      <Page title="Quiz" subtitle={topic.title} back={back}>
        <Card>
          <p className={muted}>Quiz done</p>
          <p className="mt-1 text-4xl font-bold" data-testid="score">
            {score} / {questions.length}
          </p>
          <p className={`mt-2 ${muted}`}>{quizMessage(score, questions.length)}</p>
          <div className="mt-4 flex gap-3">
            <button type="button" className={`${btnSecondary} flex-1`} onClick={start}>
              Again
            </button>
            <Link to="/korea" className={`${btnSecondary} flex flex-1 items-center justify-center`}>
              All topics
            </Link>
          </div>
        </Card>
      </Page>
    );
  }

  const answered = picked !== null;
  return (
    <Page title="Quiz" subtitle={`Question ${index + 1} of ${questions.length}`} back={back}>
      <Card>
        <p className="text-lg font-semibold leading-relaxed" data-testid="prompt">
          <MixedText text={question.question} />
        </p>
      </Card>
      <div className="grid gap-3">
        {question.shuffled.map((option) => (
          <button
            key={option}
            type="button"
            disabled={answered}
            data-correct={option === question.answer}
            onClick={() => {
              setPicked(option);
              const correct = option === question.answer;
              if (correct) setScore(score + 1);
              void logDrill(correct);
            }}
            className={`min-h-14 rounded-2xl border-2 px-3 py-2 text-left font-medium ${choiceClass(
              answered,
              option === question.answer,
              option === picked,
            )}`}
          >
            <MixedText text={option} />
          </button>
        ))}
      </div>
      {answered && (
        <>
          <p role="status" className="leading-relaxed">
            <span className="font-medium">
              {picked === question.answer ? 'Correct. ' : 'The right answer is highlighted. '}
            </span>
            <MixedText text={question.why} />
          </p>
          <button type="button" className={`${btnPrimary} w-full`} onClick={next}>
            Next
          </button>
        </>
      )}
    </Page>
  );
}
