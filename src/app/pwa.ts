/**
 * Browser side of the PWA: service worker registration, "update ready", and the install
 * prompt. A tiny external store; components read it with `usePwa()`.
 */
import { useSyncExternalStore } from 'react';

/** Chrome's install prompt event (not in TypeScript's DOM types yet). */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PwaState {
  /** A new version is installed and waiting; Reload switches to it. */
  updateReady: boolean;
  /** The browser offered to install the app (Chrome, Edge, Samsung Internet). */
  canInstall: boolean;
  /** Running as an installed app (from the home screen). */
  installed: boolean;
  /** iPhone or iPad Safari: no install prompt, Add to Home Screen is manual. */
  ios: boolean;
  /** The service worker controls this page, so the app works offline. */
  offlineReady: boolean;
}

let state: PwaState = {
  updateReady: false,
  canInstall: false,
  installed: false,
  ios: false,
  offlineReady: false,
};
let waiting: ServiceWorker | null = null;
/** Set when the user taps Reload; only then may a new service worker reload the page. */
let updateRequested = false;
let installEvent: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function update(patch: Partial<PwaState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePwa(): PwaState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac, but has touch.
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** Called once from main.tsx. */
export function startPwa(): void {
  update({ installed: isStandalone(), ios: isIos() });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // show our own Install button instead of the mini-bar
    installEvent = event as InstallPromptEvent;
    update({ canInstall: true });
  });
  window.addEventListener('appinstalled', () => {
    installEvent = null;
    update({ canInstall: false, installed: true });
  });

  // Only the production build has a service worker (dev uses Vite's live reload).
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // The new version took over after the user tapped Reload. (On the very first visit
    // the worker also takes control, but then nothing needs reloading.)
    if (!updateRequested) {
      update({ offlineReady: true });
      return;
    }
    updateRequested = false;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((registration) => {
        const markWaiting = (worker: ServiceWorker | null) => {
          // Only an update waits; the very first install activates at once.
          if (worker && navigator.serviceWorker.controller) {
            waiting = worker;
            update({ updateReady: true });
          }
        };
        markWaiting(registration.waiting);
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed') markWaiting(worker);
            if (worker.state === 'activated') update({ offlineReady: true });
          });
        });
        if (registration.active) update({ offlineReady: true });
      })
      .catch(() => {
        // No offline support (e.g. a private window); the app still works online.
      });
  });
}

/** Switches to the waiting version; the page reloads when it takes over. */
export function applyUpdate(): void {
  updateRequested = true;
  if (waiting) waiting.postMessage({ type: 'SKIP_WAITING' });
  else window.location.reload();
}

/** Shows the browser's install dialog. */
export async function promptInstall(): Promise<void> {
  if (!installEvent) return;
  await installEvent.prompt();
  await installEvent.userChoice;
  installEvent = null;
  update({ canInstall: false });
}
