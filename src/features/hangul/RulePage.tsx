import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { btnPrimary, muted } from '../../components/ui';
import { RULE_LESSONS } from '../../content/hangul';
import { useAppStore } from '../../lib/storage/store';
import { SpeakButton, VoiceNotice } from './shared';
import { MixedText } from '../../components/MixedText';

export function RulePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const markLessonDone = useAppStore((s) => s.markLessonDone);
  const rule = RULE_LESSONS.find((r) => r.id === id);
  if (!rule) return <Navigate to="/learn/hangul" replace />;

  return (
    <Page
      title={rule.title}
      subtitle={rule.summary}
      back={{ to: '/learn/hangul', label: 'Hangul' }}
    >
      <VoiceNotice />
      <div className="space-y-3 text-sm leading-relaxed">
        {rule.explanation.map((paragraph) => (
          <p key={paragraph}>
            <MixedText text={paragraph} />
          </p>
        ))}
      </div>

      <Card>
        <h2 className="font-semibold">Examples</h2>
        <p className={`mt-1 ${muted}`}>Written form, then how it is pronounced.</p>
        <ul className="mt-2 divide-y divide-stone-200 dark:divide-stone-800">
          {rule.examples.map((example) => (
            <li key={example.korean} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-2xl" lang="ko">
                  {example.korean}
                  {example.pronounced !== example.korean && (
                    <span className="text-teal-700 dark:text-teal-400">
                      {' '}
                      [{example.pronounced}]
                    </span>
                  )}
                </p>
                <p className={muted}>{example.meaning}</p>
              </div>
              <SpeakButton text={example.korean} />
            </li>
          ))}
        </ul>
      </Card>

      <button
        type="button"
        className={`${btnPrimary} w-full`}
        onClick={() => void markLessonDone(rule.id).then(() => navigate('/learn/hangul'))}
      >
        Mark as done
      </button>
    </Page>
  );
}
