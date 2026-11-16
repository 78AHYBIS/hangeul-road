import { ComingSoon, Page } from '../../components/Page';

export function KoreaPage() {
  return (
    <Page title="Korea" subtitle="Culture, daily life and the apps you will need.">
      <ComingSoon
        items={[
          {
            title: 'Culture and daily life',
            text: 'Short cards on etiquette and how things work.',
            phase: 6,
          },
          { title: 'Ulsan and UNIST', text: 'The city, the campus and getting there.', phase: 6 },
          { title: 'Korea apps', text: 'What to install and what needs an ARC.', phase: 7 },
          {
            title: 'Arrival checklists',
            text: 'Before you fly, first week, after your ARC.',
            phase: 7,
          },
        ]}
      />
    </Page>
  );
}
