import { useState } from 'react';
import { muted } from '../../components/ui';
import { useAppStore } from '../../lib/storage/store';
import { usePwa } from '../../app/pwa';
import {
  askNotificationPermission,
  notificationPermission,
  reminderSupport,
  showTestReminder,
} from '../../app/reminders';

/** Optional daily reminder, with an honest note on what this browser can do. */
export function ReminderSetting() {
  const on = useAppStore((s) => s.settings.reminderOn);
  const time = useAppStore((s) => s.settings.reminderTime);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const { ios, installed } = usePwa();
  const support = reminderSupport();
  const [permission, setPermission] = useState(notificationPermission);

  async function toggle(next: boolean) {
    if (next) {
      const allowed = await askNotificationPermission();
      setPermission(notificationPermission());
      if (!allowed) return;
    }
    await updateSettings({ reminderOn: next });
  }

  return (
    <section aria-labelledby="reminder-title" className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 id="reminder-title" className="font-semibold">
            Daily reminder
          </h2>
          <p className={muted}>Only on days with nothing studied yet.</p>
        </div>
        <input
          type="checkbox"
          role="switch"
          aria-label="Daily reminder"
          className="size-6 shrink-0 accent-teal-700"
          checked={on}
          disabled={support === 'none' || permission === 'denied'}
          onChange={(e) => void toggle(e.target.checked)}
        />
      </div>

      {on && (
        <div className="flex items-center gap-3">
          <label className="flex flex-1 items-center justify-between gap-3 text-sm font-medium">
            Time
            <input
              type="time"
              className="min-h-11 rounded-lg border border-stone-300 bg-transparent px-3 dark:border-stone-700"
              value={time}
              onChange={(e) => {
                if (e.target.value) void updateSettings({ reminderTime: e.target.value });
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => void showTestReminder()}
            className="min-h-11 rounded-full border border-stone-300 px-4 text-sm font-medium dark:border-stone-700"
          >
            Test
          </button>
        </div>
      )}

      <p className={muted} data-testid="reminder-note">
        {support === 'none'
          ? ios && !installed
            ? 'On iPhone, notifications need the app on your Home Screen (see Install above). Until then, a phone alarm works well.'
            : 'This browser cannot show notifications. A daily alarm or calendar reminder on your phone works just as well.'
          : permission === 'denied'
            ? 'Notifications are blocked for this site. Allow them in the browser’s site settings to use the reminder.'
            : support === 'full'
              ? 'Without a server, the phone decides when the app may run in the background, so the reminder can come a little late. It is most reliable with the app installed.'
              : 'Without a server, the reminder only appears while the app is open or in the background. For a reminder at an exact time, a phone alarm is more reliable.'}
      </p>
    </section>
  );
}
