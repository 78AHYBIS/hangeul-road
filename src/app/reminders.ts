/**
 * Daily reminder, browser side (rules in src/lib/reminder.ts).
 *
 * Without a server, a web app cannot wake the phone at a set time. So:
 * - while the app is open (also in a background tab), a timer shows the reminder at the
 *   chosen time if nothing was studied yet;
 * - where Periodic Background Sync exists (Chrome on Android, installed app), the
 *   service worker checks now and then, even with the app closed. The browser decides
 *   how often, so the time is approximate.
 */
import { useEffect } from 'react';
import { isStudied } from '../lib/activity';
import { todayISO } from '../lib/date';
import { msUntil, reminderDue } from '../lib/reminder';
import { useAppStore } from '../lib/storage/store';

const SHOWN_KEY = 'hangeul-road:reminder-shown';

export type ReminderSupport = 'full' | 'open-only' | 'none';

/** What this browser can do, for the note under the setting. */
export function reminderSupport(): ReminderSupport {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'none';
  if (!('serviceWorker' in navigator)) return 'none';
  return 'periodicSync' in ServiceWorkerRegistration.prototype ? 'full' : 'open-only';
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return 'Notification' in window ? Notification.permission : 'unsupported';
}

/** Asks for permission (must run from a tap). Returns true when notifications are allowed. */
export async function askNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  return (await Notification.requestPermission()) === 'granted';
}

async function show(body: string) {
  const registration = await navigator.serviceWorker?.getRegistration();
  const options = { body, icon: './icons/icon-192.png', tag: 'daily-reminder' };
  if (registration) await registration.showNotification('Hangeul Road', options);
  else new Notification('Hangeul Road', options);
}

/** A test notification, so the user sees what the reminder looks like. */
export function showTestReminder(): Promise<void> {
  return show('This is how your daily reminder will look.');
}

async function registerPeriodicSync(on: boolean) {
  const registration = await navigator.serviceWorker?.getRegistration();
  const sync = (
    registration as
      | (ServiceWorkerRegistration & {
          periodicSync?: {
            register: (tag: string, o: { minInterval: number }) => Promise<void>;
            unregister: (tag: string) => Promise<void>;
          };
        })
      | undefined
  )?.periodicSync;
  if (!sync) return;
  try {
    if (on) await sync.register('daily-reminder', { minInterval: 60 * 60 * 1000 });
    else await sync.unregister('daily-reminder');
  } catch {
    // Not allowed (e.g. the app is not installed): the in-app timer still works.
  }
}

/** Mounted once in App: keeps the timer and the service worker's copy of the settings. */
export function useReminders() {
  const on = useAppStore((s) => s.settings.reminderOn);
  const time = useAppStore((s) => s.settings.reminderTime);
  const today = todayISO();
  const studiedToday = useAppStore((s) => isStudied(s.activity.days[today]));

  // Tell the service worker, which cannot read app state, what it needs.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    void navigator.serviceWorker.ready.then((registration) => {
      registration.active?.postMessage({
        type: 'REMINDER',
        meta: { on, time, studiedOn: studiedToday ? today : null },
      });
    });
    void registerPeriodicSync(on);
  }, [on, time, studiedToday, today]);

  // In-app timer: fires at the reminder time while the app is open.
  useEffect(() => {
    if (!on || studiedToday || notificationPermission() !== 'granted') return;
    const check = () => {
      const now = new Date();
      let lastShown: string | null = null;
      try {
        lastShown = localStorage.getItem(SHOWN_KEY);
      } catch {
        // storage blocked: the notification tag still prevents duplicates
      }
      const due = reminderDue({
        on,
        time,
        today: todayISO(),
        nowMinutes: now.getHours() * 60 + now.getMinutes(),
        lastShown,
        studiedToday,
      });
      if (!due) return;
      try {
        localStorage.setItem(SHOWN_KEY, todayISO());
      } catch {
        // see above
      }
      void show('Your plan for today is ready. Five minutes counts too.');
    };
    const now = new Date();
    const wait = msUntil(time, now.getHours() * 60 + now.getMinutes(), now.getSeconds());
    // Check at the reminder time, then every 10 minutes (covers sleep and clock changes).
    const first = setTimeout(check, wait);
    const repeat = setInterval(check, 10 * 60 * 1000);
    return () => {
      clearTimeout(first);
      clearInterval(repeat);
    };
  }, [on, time, studiedToday]);
}
