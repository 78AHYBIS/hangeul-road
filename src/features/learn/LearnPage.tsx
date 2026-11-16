import { ComingSoon, Page } from '../../components/Page';

export function LearnPage() {
  return (
    <Page title="Learn" subtitle="Hangul, words, grammar and phrases.">
      <ComingSoon
        items={[
          { title: 'Hangul', text: 'All 40 letters, sound rules, drills and typing.', phase: 1 },
          { title: 'Vocabulary', text: 'Themed decks with spaced repetition.', phase: 2 },
          { title: 'Grammar', text: 'Short lessons for polite sentences.', phase: 5 },
          { title: 'Phrases', text: 'Situation packs and an offline phrasebook.', phase: 5 },
        ]}
      />
    </Page>
  );
}
