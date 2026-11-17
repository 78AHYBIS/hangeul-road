import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { btnPrimary, btnSecondary, choiceClass, muted } from '../../components/ui';
import { GRAMMAR_LESSONS, findGrammarLesson, type GrammarLesson } from '../../content/grammar';
import { speak } from '../../lib/speech';
import { useAppStore } from '../../lib/storage/store';
import { SpeakButton, VoiceNotice } from '../hangul/shared';
import {
  GAP,
  PRACTICE_LABEL,
  buildPractice,
  correctSentence,
  isTilesCorrect,
  type PracticeItem,
  type Tile,
} from './practice';

export function GrammarPracticePage() {
  const { id } = useParams();
  const lesson = findGrammarLesson(id);
  if (!lesson) return <Navigate to="/learn/grammar" replace />;
  return <Session key={lesson.id} lesson={lesson} />;
}

function Session({ lesson }: { lesson: GrammarLesson }) {
  const logDrill = useAppStore((s) => s.logDrill);
  const finish = useAppStore((s) => s.finishGrammarPractice);
  const [items, setItems] = useState<PracticeItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const back = { to: `/learn/grammar/${lesson.id}`, label: lesson.title };

  function start() {
    setItems(buildPractice(lesson, Math.random));
    setIndex(0);
    setScore(0);
  }

  function answered(correct: boolean) {
    if (correct) setScore((s) => s + 1);
    void logDrill(correct);
  }

  function next() {
    if (!items) return;
    if (index + 1 === items.length) void finish(lesson.id, score, items.length);
    setIndex(index + 1);
  }

  if (!items) {
    return (
      <Page title="Practice" subtitle={lesson.title} back={back}>
        <Card>
          <p className="leading-relaxed">
            {lesson.practice.length} short questions: choosing particles, filling gaps, and building
            sentences from tiles.
          </p>
          <p className={`mt-2 ${muted}`}>Finishing the practice marks the lesson as done.</p>
          <button type="button" className={`${btnPrimary} mt-4 w-full`} onClick={start}>
            Start
          </button>
        </Card>
      </Page>
    );
  }

  const item = items[index];
  if (!item) {
    const next = GRAMMAR_LESSONS[GRAMMAR_LESSONS.indexOf(lesson) + 1];
    return (
      <Page title="Practice" subtitle={lesson.title} back={back}>
        <Card>
          <p className={muted}>Lesson done</p>
          <p className="mt-1 text-4xl font-bold" data-testid="score">
            {score} / {items.length}
          </p>
          <div className="mt-4 grid gap-3">
            {next && (
              <Link
                to={`/learn/grammar/${next.id}`}
                className={`${btnPrimary} flex items-center justify-center`}
              >
                Next lesson
              </Link>
            )}
            <div className="flex gap-3">
              <button type="button" className={`${btnSecondary} flex-1`} onClick={start}>
                Again
              </button>
              <Link
                to="/learn/grammar"
                className={`${btnSecondary} flex flex-1 items-center justify-center`}
              >
                All lessons
              </Link>
            </div>
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title={PRACTICE_LABEL[item.practice.type]}
      subtitle={`Question ${index + 1} of ${items.length}`}
      back={back}
    >
      <VoiceNotice />
      {/* `key` resets the question's own state when moving on. */}
      {item.kind === 'choice' ? (
        <ChoiceQuestion key={index} item={item} onAnswer={answered} onNext={next} />
      ) : (
        <TilesQuestion key={index} item={item} onAnswer={answered} onNext={next} />
      )}
    </Page>
  );
}

interface QuestionProps<T> {
  item: T;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}

function ChoiceQuestion({
  item,
  onAnswer,
  onNext,
}: QuestionProps<Extract<PracticeItem, { kind: 'choice' }>>) {
  const rate = useAppStore((s) => s.settings.speechRate);
  const [picked, setPicked] = useState<string | null>(null);
  const { practice } = item;
  const [before, after] = practice.korean.split(GAP);
  const sentence = correctSentence(practice);

  return (
    <>
      <Card>
        <p className={muted}>{practice.meaning}</p>
        <p className="mt-3 text-2xl leading-relaxed" lang="ko" data-testid="prompt">
          {before}
          <span
            className={`mx-0.5 inline-block min-w-12 rounded-md border-b-2 px-1 text-center ${
              picked === null
                ? 'border-stone-400'
                : 'border-teal-700 text-teal-700 dark:text-teal-400'
            }`}
          >
            {picked === null ? ' ' : practice.answer}
          </span>
          {after}
        </p>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        {item.options.map((option) => (
          <button
            key={option}
            type="button"
            disabled={picked !== null}
            lang="ko"
            data-correct={option === practice.answer}
            onClick={() => {
              setPicked(option);
              onAnswer(option === practice.answer);
              speak(sentence, rate);
            }}
            className={`min-h-16 rounded-2xl border-2 px-2 text-xl font-medium ${choiceClass(
              picked !== null,
              option === practice.answer,
              option === picked,
            )}`}
          >
            {option}
          </button>
        ))}
      </div>
      {picked !== null && (
        <Feedback
          correct={picked === practice.answer}
          sentence={sentence}
          why={practice.why}
          onNext={onNext}
        />
      )}
    </>
  );
}

function TilesQuestion({
  item,
  onAnswer,
  onNext,
}: QuestionProps<Extract<PracticeItem, { kind: 'tiles' }>>) {
  const rate = useAppStore((s) => s.settings.speechRate);
  const [picked, setPicked] = useState<Tile[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const { practice } = item;
  const remaining = item.pool.filter((t) => !picked.includes(t));
  const sentence = correctSentence(practice);

  function check() {
    const correct = isTilesCorrect(
      practice,
      picked.map((t) => t.text),
    );
    setChecked(correct);
    onAnswer(correct);
    speak(sentence, rate);
  }

  const tileClass =
    'min-h-11 rounded-xl border-2 px-3 text-lg font-medium disabled:opacity-60 dark:border-stone-700';

  return (
    <>
      <Card>
        <p className={muted}>
          {practice.type === 'translate' ? 'Say this in Korean:' : 'Make this sentence:'}
        </p>
        <p className="mt-1 text-lg font-medium">{practice.meaning}</p>
        <div
          className="mt-3 flex min-h-14 flex-wrap items-center gap-2 border-b-2 border-stone-300 pb-2 dark:border-stone-700"
          aria-label="Your sentence"
          data-testid="answer-line"
        >
          {picked.length === 0 && <span className={muted}>Tap the tiles below in order.</span>}
          {picked.map((tile) => (
            <button
              key={tile.key}
              type="button"
              lang="ko"
              disabled={checked !== null}
              onClick={() => setPicked(picked.filter((t) => t !== tile))}
              className={`${tileClass} border-teal-700 bg-teal-50 dark:bg-teal-950`}
            >
              {tile.text}
            </button>
          ))}
        </div>
      </Card>
      <div className="flex flex-wrap gap-2" data-testid="tile-pool">
        {remaining.map((tile) => (
          <button
            key={tile.key}
            type="button"
            lang="ko"
            disabled={checked !== null}
            onClick={() => setPicked([...picked, tile])}
            className={`${tileClass} border-stone-300`}
          >
            {tile.text}
          </button>
        ))}
      </div>
      {checked === null ? (
        <div className="flex gap-3">
          <button
            type="button"
            className={`${btnSecondary} flex-1`}
            disabled={picked.length === 0}
            onClick={() => setPicked([])}
          >
            Clear
          </button>
          <button
            type="button"
            className={`${btnPrimary} flex-1`}
            disabled={picked.length === 0}
            onClick={check}
          >
            Check
          </button>
        </div>
      ) : (
        <Feedback correct={checked} sentence={sentence} onNext={onNext} />
      )}
    </>
  );
}

function Feedback({
  correct,
  sentence,
  why,
  onNext,
}: {
  correct: boolean;
  sentence: string;
  why?: string;
  onNext: () => void;
}) {
  return (
    <>
      <Card>
        <p role="status" className="font-medium">
          {correct ? 'Correct' : 'Not quite. The answer is:'}
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xl" lang="ko" data-testid="answer">
            {sentence}
          </p>
          <SpeakButton text={sentence} label="Play" />
        </div>
        {why && <p className={`mt-2 ${muted}`}>{why}</p>}
      </Card>
      <button type="button" className={`${btnPrimary} w-full`} onClick={onNext}>
        Next
      </button>
    </>
  );
}
