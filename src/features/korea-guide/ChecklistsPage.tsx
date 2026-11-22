import { Card, Page } from '../../components/Page';
import { muted } from '../../components/ui';
import { CHECKLISTS } from '../../content/korea-apps';
import { useAppStore } from '../../lib/storage/store';
import { checklistStatus } from './guide';
import { ChecklistItems } from './shared';

export function ChecklistsPage() {
  const progress = useAppStore((s) => s.koreaGuide);
  return (
    <Page
      title="Arrival checklists"
      subtitle="Ticks are saved. In the last three weeks before you fly, the current list also shows on Today."
      back={{ to: '/korea', label: 'Korea' }}
    >
      {CHECKLISTS.map((checklist) => {
        const { done, total } = checklistStatus(checklist, progress);
        return (
          <Card key={checklist.id}>
            <section aria-labelledby={checklist.id} data-checklist={checklist.id}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 id={checklist.id} className="text-lg font-semibold">
                  {checklist.title}
                </h2>
                <p className={`tabular-nums ${muted}`}>
                  {done} / {total}
                </p>
              </div>
              <p className={`mt-1 ${muted}`}>{checklist.intro}</p>
              <div className="mt-1">
                <ChecklistItems checklist={checklist} />
              </div>
            </section>
          </Card>
        );
      })}
    </Page>
  );
}
