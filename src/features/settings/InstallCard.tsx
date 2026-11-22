import { Card } from '../../components/Page';
import { btnPrimary, muted } from '../../components/ui';
import { promptInstall, usePwa } from '../../app/pwa';

/** "Install the app": the browser's prompt where it exists, steps for iPhone otherwise. */
export function InstallCard() {
  const { canInstall, installed, ios, offlineReady } = usePwa();

  return (
    <Card>
      <section aria-labelledby="install-title">
        <h2 id="install-title" className="font-semibold">
          {installed ? 'Installed app' : 'Install the app'}
        </h2>
        {installed ? (
          <p className={`mt-1 ${muted}`}>
            You are using the installed app.{' '}
            {offlineReady ? 'Everything works offline.' : 'Offline mode is getting ready.'}
          </p>
        ) : (
          <>
            <p className={`mt-1 ${muted}`}>
              An icon on your home screen, full screen, and everything works in airplane mode.
            </p>
            {canInstall ? (
              <button
                type="button"
                className={`mt-3 w-full ${btnPrimary}`}
                onClick={() => void promptInstall()}
              >
                Install Hangeul Road
              </button>
            ) : ios ? (
              <ol className={`mt-2 list-decimal space-y-1 pl-5 ${muted}`}>
                <li>Open this page in Safari.</li>
                <li>Tap the Share button (the square with an arrow).</li>
                <li>Tap “Add to Home Screen”, then “Add”.</li>
              </ol>
            ) : (
              <p className={`mt-2 ${muted}`}>
                In Chrome on Android: menu (⋮) → “Add to Home screen” or “Install app”. On a
                computer, use the install icon in the address bar.
              </p>
            )}
            {offlineReady && (
              <p className={`mt-2 ${muted}`}>
                Offline mode is ready in this browser too, even without installing.
              </p>
            )}
          </>
        )}
      </section>
    </Card>
  );
}
