import { Card, Page } from '../../components/Page';
import { muted } from '../../components/ui';
import { formatLongDate } from '../../lib/date';
import { IN_KOREA } from '../../lib/roadmap';
import { useToday } from './useToday';

export function RoadmapPage() {
  const { stages, position, today, settings } = useToday();
  return (
    <Page
      title="Roadmap"
      subtitle={`Week ${position.week} of ${position.totalWeeks}, up to ${formatLongDate(settings.departureDate)}`}
      back={{ to: '/', label: 'Today' }}
    >
      <ol className="space-y-3">
        {stages.map((stage, i) => {
          const current = position.stageId === stage.id;
          const past = today > stage.end;
          return (
            <li key={stage.id}>
              <Card tone={current ? 'accent' : 'plain'}>
                <p className={current ? 'text-sm text-teal-100' : muted}>
                  Stage {i + 1} · {stage.weeks} {stage.weeks === 1 ? 'week' : 'weeks'}
                  {current && ' · you are here'}
                  {past && ' · finished'}
                </p>
                <h2 className="mt-1 font-semibold">{stage.title}</h2>
                <p className={`mt-1 ${current ? 'text-sm text-teal-100' : muted}`}>{stage.focus}</p>
                <p className={`mt-2 ${current ? 'text-sm text-teal-100' : muted}`}>
                  {formatLongDate(stage.start)} to {formatLongDate(stage.end)}
                </p>
              </Card>
            </li>
          );
        })}
        <li>
          <Card tone={position.stageId === 'in-korea' ? 'accent' : 'plain'}>
            <p className={position.stageId === 'in-korea' ? 'text-sm text-teal-100' : muted}>
              From {formatLongDate(settings.departureDate)}
            </p>
            <h2 className="mt-1 font-semibold">{IN_KOREA.title}</h2>
            <p
              className={`mt-1 ${position.stageId === 'in-korea' ? 'text-sm text-teal-100' : muted}`}
            >
              {IN_KOREA.focus}
            </p>
          </Card>
        </li>
      </ol>
      <p className={muted}>
        The stages are worked out from your start date and departure date. Change either in Me and
        the roadmap adjusts.
      </p>
    </Page>
  );
}
