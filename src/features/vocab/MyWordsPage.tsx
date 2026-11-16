import { useState, type FormEvent } from 'react';
import { Card, Page } from '../../components/Page';
import { btnPrimary, muted } from '../../components/ui';
import { useAppStore } from '../../lib/storage/store';

const HANGUL = /[가-힣]/;
const inputClass =
  'mt-1 w-full rounded-lg border border-stone-300 bg-transparent px-3 py-2.5 dark:border-stone-700';

export function MyWordsPage() {
  const myWords = useAppStore((s) => s.vocab.myWords);
  const addMyWord = useAppStore((s) => s.addMyWord);
  const deleteMyWord = useAppStore((s) => s.deleteMyWord);
  const [korean, setKorean] = useState('');
  const [meaning, setMeaning] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!HANGUL.test(korean)) return setError('Write the word in Hangul.');
    if (!meaning.trim()) return setError('Add the meaning.');
    if (myWords.some((w) => w.korean === korean.trim()))
      return setError('You already added this word.');
    await addMyWord({ korean, meaning, note });
    setKorean('');
    setMeaning('');
    setNote('');
    setError('');
  }

  return (
    <Page
      title="My words"
      subtitle="Words you meet in class or in real life. They join your reviews."
      back={{ to: '/learn/vocab', label: 'Vocabulary' }}
    >
      <Card>
        <form onSubmit={(e) => void submit(e)} className="space-y-3">
          <label className="block text-sm font-medium">
            Korean
            <input
              className={inputClass}
              lang="ko"
              value={korean}
              onChange={(e) => setKorean(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            Meaning
            <input
              className={inputClass}
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            Note (optional)
            <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          {error && (
            <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">
              {error}
            </p>
          )}
          <button type="submit" className={`${btnPrimary} w-full`}>
            Add word
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="font-semibold">{myWords.length} added</h2>
        {myWords.length === 0 && <p className={`mt-1 ${muted}`}>Nothing yet.</p>}
        <ul className="divide-y divide-stone-200 dark:divide-stone-800">
          {myWords.map((word) => (
            <li key={word.id} className="flex items-center justify-between gap-3 py-2.5">
              <span>
                <span className="block text-xl" lang="ko">
                  {word.korean}
                </span>
                <span className={`block ${muted}`}>
                  {word.meaning}
                  {word.note && ` · ${word.note}`}
                </span>
              </span>
              <button
                type="button"
                className="min-h-10 rounded-lg px-3 text-sm text-stone-500 underline"
                onClick={() => {
                  if (window.confirm(`Delete ${word.korean}?`)) void deleteMyWord(word.id);
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </Page>
  );
}
