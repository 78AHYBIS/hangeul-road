import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { btnPrimary, btnSecondary, muted } from '../../components/ui';
import { todayISO } from '../../lib/date';
import { speak } from '../../lib/speech';
import { LIMITS, buildQueue, review, type Grade } from '../../lib/srs';
import { useAppStore } from '../../lib/storage/store';
import { SpeakButton, VoiceNotice } from '../hangul/shared';
import { useKoreanVoice } from '../hangul/useKoreanVoice';
import { allWords, cardTypeFor, isTypedCorrect, studyOrder, type CardType } from './words';

const BACK = { to: '/learn/vocab', label: 'Vocabulary' };

const GRADE_BUTTONS: { grade: Grade; label: string; style: string }[] = [
  { grade: 'again', label: 'Again', style: 'border-amber-500 text-amber-800 dark:text-amber-300' },
  { grade: 'hard', label: 'Hard', style: 'border-stone-400' },
  { grade: 'good', label: 'Good', style: 'border-teal-700 bg-teal-700 text-white' },
  { grade: 'easy', label: 'Easy', style: 'border-teal-700 text-teal-800 dark:text-teal-300' },
];

/** "tomorrow", "in 3 days"... shown under each answer button. */
function whenLabel(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return '1 day';
  return days < 30 ? `${days} days` : `${Math.round(days / 30)} mo`;
}

export function ReviewPage() {
  const vocab = useAppStore((s) => s.vocab);
  const settings = useAppStore((s) => s.settings);
  const gradeWord = useAppStore((s) => s.gradeWord);
  const voice = useKoreanVoice() === 'available';

  // The session: word ids still to show, and the card type chosen for the current one.
  const [queue, setQueue] = useState<string[] | null>(null);
  const [cardType, setCardType] = useState<CardType>('ko-meaning');
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState('');
  const [done, setDone] = useState(0);

  const words = new Map(allWords(vocab.myWords).map((w) => [w.id, w]));
  const typeOptions = { voice, typing: settings.typingCards };

  function show(nextQueue: string[]) {
    const id = nextQueue[0];
    const type = cardTypeFor(id ? vocab.cards[id] : undefined, typeOptions);
    setQueue(nextQueue);
    setCardType(type);
    setRevealed(false);
    setTyped('');
    const word = id ? words.get(id) : undefined;
    if (word && type === 'listening') speak(word.korean, settings.speechRate);
  }

  function start() {
    const today = buildQueue(
      vocab.cards,
      studyOrder(vocab),
      todayISO(),
      LIMITS[settings.dailyGoal],
    );
    setDone(0);
    show([...today.reviews, ...today.newCards]);
  }

  if (!queue) {
    const today = buildQueue(
      vocab.cards,
      studyOrder(vocab),
      todayISO(),
      LIMITS[settings.dailyGoal],
    );
    const total = today.reviews.length + today.newCards.length;
    return (
      <Page title="Review" back={BACK}>
        <VoiceNotice />
        <Card>
          {total === 0 ? (
            <>
              <p className="text-lg font-semibold">Nothing to review right now</p>
              <p className={`mt-1 ${muted}`}>Come back tomorrow, or add more words.</p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold">
                {today.reviews.length} reviews and {today.newCards.length} new words
              </p>
              <p className={`mt-1 ${muted}`}>
                Say the answer in your head, reveal it, then rate how well you knew it.
              </p>
              <button type="button" className={`${btnPrimary} mt-4 w-full`} onClick={start}>
                Start
              </button>
            </>
          )}
        </Card>
      </Page>
    );
  }

  const word = words.get(queue[0] ?? '');
  if (!word) {
    return (
      <Page title="Review" back={BACK}>
        <Card>
          <p className={muted}>Session finished</p>
          <p className="mt-1 text-4xl font-bold" data-testid="review-done">
            {done} cards
          </p>
          <p className={`mt-2 ${muted}`}>Each word comes back just before you would forget it.</p>
          <Link to="/learn/vocab" className={`${btnPrimary} mt-4 flex items-center justify-center`}>
            Done
          </Link>
        </Card>
      </Page>
    );
  }

  const card = vocab.cards[word.id];
  const showKorean = cardType === 'ko-meaning';

  function reveal() {
    setRevealed(true);
    speak(word!.korean, settings.speechRate);
  }

  function grade(g: Grade) {
    void gradeWord(word!.id, g);
    setDone(done + 1);
    // "Again" puts the card at the end of this session, so it is seen once more today.
    const rest = queue!.slice(1);
    show(g === 'again' ? [...rest, word!.id] : rest);
  }

  return (
    <Page title="Review" subtitle={`${queue.length} left`} back={BACK}>
      <Card>
        <div className="flex min-h-56 flex-col items-center justify-center gap-3 py-2 text-center">
          <p className={`text-xs tracking-wide uppercase ${muted}`} data-testid="card-type">
            {!card ? 'New word' : PROMPTS[cardType]}
          </p>

          {showKorean && (
            <p className="text-5xl" lang="ko" data-testid="card-front">
              {word.korean}
            </p>
          )}
          {(cardType === 'meaning-ko' || cardType === 'typing') && (
            <p className="text-3xl font-semibold" data-testid="card-front">
              {word.meaning}
            </p>
          )}
          {cardType === 'listening' && !revealed && (
            <SpeakButton text={word.korean} label="Play again" />
          )}

          {cardType === 'typing' && !revealed && (
            <form
              className="w-full"
              onSubmit={(e) => {
                e.preventDefault();
                reveal();
              }}
            >
              <input
                lang="ko"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="한글로 쓰세요"
                aria-label="Type the word in Hangul"
                autoComplete="off"
                className="w-full rounded-lg border border-stone-300 bg-transparent px-3 py-3 text-center text-2xl dark:border-stone-700"
              />
            </form>
          )}

          {revealed && (
            <div className="w-full space-y-2" data-testid="card-back">
              {!showKorean && (
                <p className="text-5xl" lang="ko">
                  {word.korean}
                </p>
              )}
              {cardType === 'typing' && typed.trim() !== '' && (
                <p role="status" className="font-medium">
                  {isTypedCorrect(typed, word.korean)
                    ? 'You typed it correctly'
                    : `You typed: ${typed}`}
                </p>
              )}
              {cardType !== 'meaning-ko' && cardType !== 'typing' && (
                <p className="text-2xl font-semibold">{word.meaning}</p>
              )}
              {word.pos && <p className={muted}>{word.pos}</p>}
              {word.example && (
                <p className="rounded-xl bg-stone-100 p-3 text-left dark:bg-stone-800">
                  <span className="block text-lg" lang="ko">
                    {word.example}
                  </span>
                  <span className={muted}>{word.exampleMeaning}</span>
                </p>
              )}
              {word.note && <p className="text-left text-sm">{word.note}</p>}
              <div className="flex justify-center gap-2">
                <SpeakButton text={word.korean} label="Word" />
                {word.example && <SpeakButton text={word.example} label="Sentence" />}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Answer buttons stay at the bottom, within thumb reach. */}
      {!revealed ? (
        <button type="button" className={`${btnPrimary} w-full`} onClick={reveal}>
          {cardType === 'typing' ? 'Check' : 'Show answer'}
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {GRADE_BUTTONS.map(({ grade: g, label, style }) => (
            <button
              key={g}
              type="button"
              onClick={() => grade(g)}
              className={`flex min-h-14 flex-col items-center justify-center rounded-xl border-2 text-sm font-medium ${style}`}
            >
              {label}
              <span className="text-[11px] font-normal opacity-80">
                {whenLabel(review(card, g, todayISO()).interval)}
              </span>
            </button>
          ))}
        </div>
      )}
      {!revealed && (
        <p className={`text-center ${muted}`}>
          <button
            type="button"
            className={`${btnSecondary} border-0 underline`}
            onClick={() => setQueue([])}
          >
            Stop for now
          </button>
        </p>
      )}
    </Page>
  );
}

const PROMPTS: Record<CardType, string> = {
  'ko-meaning': 'What does it mean?',
  'meaning-ko': 'How do you say it in Korean?',
  listening: 'Listen. What does it mean?',
  typing: 'Type it in Korean',
};
