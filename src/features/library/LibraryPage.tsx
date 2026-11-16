import { ComingSoon, Page } from '../../components/Page';

export function LibraryPage() {
  return (
    <Page title="Library" subtitle="Outside courses, channels and tools in one place.">
      <ComingSoon
        items={[
          { title: 'Resources', text: 'Verified courses, channels, sites and apps.', phase: 4 },
          { title: 'Active course', text: 'Track units and feed them into Today.', phase: 4 },
          { title: 'Recommended path', text: 'What to use at each stage.', phase: 4 },
        ]}
      />
    </Page>
  );
}
