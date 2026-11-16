import { Link } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { daysUntil, formatLongDate } from '../../lib/date';
import { useAppStore } from '../../lib/storage/store';

export function TodayPage() {
  const departureDate = useAppStore((s) => s.settings.departureDate);
  const days = daysUntil(departureDate);

  return (
    <Page title="Today" subtitle="Your daily plan will live here.">
      <Card tone="accent">
        <p className="text-sm text-teal-100">Departure to Korea</p>
        {days > 0 ? (
          <p className="mt-1">
            <span className="text-5xl font-bold tabular-nums" data-testid="countdown-days">
              {days}
            </span>{' '}
            <span className="text-lg">{days === 1 ? 'day to go' : 'days to go'}</span>
          </p>
        ) : (
          <p className="mt-1 text-3xl font-bold" data-testid="countdown-days">
            {days === 0 ? 'Today is the day' : 'You are in Korea'}
          </p>
        )}
        <p className="mt-2 text-sm text-teal-100">
          {formatLongDate(departureDate)} ·{' '}
          <Link to="/me" className="underline underline-offset-2">
            change date
          </Link>
        </p>
      </Card>

      <Card>
        <h2 className="font-semibold">Start with Hangul</h2>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Daily tasks arrive in Phase 3. Until then, do one Hangul lesson or drill a day.
        </p>
        <Link
          to="/learn/hangul"
          className="mt-3 flex min-h-12 items-center justify-center rounded-xl bg-teal-700 font-medium text-white"
        >
          Open Hangul
        </Link>
      </Card>
    </Page>
  );
}
