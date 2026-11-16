import { Card, Page } from '../../components/Page';
import { muted } from '../../components/ui';
import { READING_CATEGORIES, READING_WORDS } from '../../content/hangul';
import { Romanization, RomanizationToggle, SpeakButton, VoiceNotice } from './shared';

export function ReadingPage() {
  return (
    <Page
      title="Real-world reading"
      subtitle="Words you will see on signs, menus and apps. Read each one aloud, then check."
      back={{ to: '/learn/hangul', label: 'Hangul' }}
    >
      <VoiceNotice />
      <Card>
        <RomanizationToggle />
      </Card>
      {READING_CATEGORIES.map((category) => (
        <Card key={category.id}>
          <h2 className="font-semibold">{category.title}</h2>
          <ul className="mt-1 divide-y divide-stone-200 dark:divide-stone-800">
            {READING_WORDS.filter((w) => w.category === category.id).map((word) => (
              <li key={word.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-2xl" lang="ko">
                    {word.korean}
                  </p>
                  <p className={muted}>
                    {word.meaning}
                    <Romanization text={` · ${word.romanization}`} />
                  </p>
                </div>
                <SpeakButton text={word.korean} />
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </Page>
  );
}
