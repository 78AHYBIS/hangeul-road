import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { btnPrimary, btnSecondary, muted } from '../../components/ui';
import { LETTERS, LETTER_BY_JAMO, LETTER_LESSONS } from '../../content/hangul';
import { useAppStore } from '../../lib/storage/store';
import { SpeakButton, VoiceNotice } from './shared';
import { StrokeOrder } from './StrokeOrder';
import { MixedText } from '../../components/MixedText';

export function LessonPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const markLessonDone = useAppStore((s) => s.markLessonDone);
  const lesson = LETTER_LESSONS.find((l) => l.id === id);
  const letters = LETTERS.filter((l) => l.group === lesson?.group);
  // The progress map links straight to one letter with ?letter=ㄱ.
  const startAt = Math.max(
    0,
    letters.findIndex((l) => l.korean === params.get('letter')),
  );
  const [index, setIndex] = useState(startAt);

  const letter = letters[index];
  if (!lesson || !letter) return <Navigate to="/learn/hangul" replace />;
  const isLast = index === letters.length - 1;

  async function finish() {
    await markLessonDone(lesson!.id);
    navigate('/learn/hangul');
  }

  return (
    <Page
      title={lesson.title}
      subtitle={`Letter ${index + 1} of ${letters.length}`}
      back={{ to: '/learn/hangul', label: 'Hangul' }}
    >
      <VoiceNotice />
      {index === 0 && (
        <p className="text-sm leading-relaxed">
          <MixedText text={lesson.intro} />
        </p>
      )}

      <Card>
        <div className="flex items-center justify-between gap-4">
          <p className="text-8xl leading-none font-medium" lang="ko" data-testid="letter">
            {letter.korean}
          </p>
          <div className="space-y-2 text-right">
            <p className="text-2xl font-semibold">{letter.sound}</p>
            <p className={muted} lang="ko">
              {letter.name}
            </p>
            <SpeakButton text={letter.speak} />
          </div>
        </div>

        <dl className="mt-4 space-y-3 text-sm leading-relaxed">
          <Info term="Sound">
            <MixedText text={letter.soundEn} />
          </Info>
          <Info term="For Russian speakers">
            <MixedText text={letter.soundRu} />
          </Info>
          <Info term="Memory hint">
            <MixedText text={letter.hint} />
          </Info>
          <Info term="Easily confused with">
            <span className="flex flex-wrap gap-2">
              {letter.confusedWith.map((jamo) => (
                <span key={jamo} className="rounded-lg bg-stone-100 px-2 py-1 dark:bg-stone-800">
                  <span className="text-lg" lang="ko">
                    {jamo}
                  </span>{' '}
                  <span className={muted}>{LETTER_BY_JAMO.get(jamo)?.sound}</span>
                </span>
              ))}
            </span>
          </Info>
        </dl>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">How to write it</h2>
        <StrokeOrder key={letter.korean} jamo={letter.korean} />
      </Card>

      <div className="flex gap-3">
        <button
          type="button"
          className={`${btnSecondary} flex-1`}
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
        >
          Previous
        </button>
        {isLast ? (
          <button type="button" className={`${btnPrimary} flex-1`} onClick={() => void finish()}>
            Finish lesson
          </button>
        ) : (
          <button
            type="button"
            className={`${btnPrimary} flex-1`}
            onClick={() => setIndex(index + 1)}
          >
            Next
          </button>
        )}
      </div>
      {isLast && (
        <p className={`text-center ${muted}`}>
          Then practise:{' '}
          <Link to="/learn/hangul/drill/letter-sound" className="underline">
            letter to sound drill
          </Link>
        </p>
      )}
    </Page>
  );
}

function Info({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-stone-500 dark:text-stone-400">{term}</dt>
      <dd>{children}</dd>
    </div>
  );
}
