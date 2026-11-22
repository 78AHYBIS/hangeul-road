/** Export / import of all progress as one JSON file. */
import { readAll, replaceAll } from './db';
import { APP_ID, BackupError, SCHEMA_VERSION, parseBackup, type BackupFile } from './schema';

export async function createBackup(now: Date = new Date()): Promise<BackupFile> {
  return {
    app: APP_ID,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    data: await readAll(),
  };
}

/**
 * Validates the file text first, and only then replaces saved data.
 * A bad file throws BackupError and leaves existing progress untouched.
 */
export async function restoreBackup(fileText: string): Promise<void> {
  let raw: unknown;
  try {
    raw = JSON.parse(fileText);
  } catch {
    throw new BackupError('This file is not valid JSON.');
  }
  await replaceAll(parseBackup(raw));
}

export function backupFileName(now: Date = new Date()): string {
  return `hangeul-road-backup-${now.toISOString().slice(0, 10)}.json`;
}

async function backupBlob(): Promise<Blob> {
  const backup = await createBackup();
  return new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
}

function download(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = backupFileName();
  link.click();
  // Some browsers start the download after this tick, so the URL is freed a little later.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Browser only: triggers a file download of the backup. */
export async function downloadBackup(): Promise<void> {
  download(await backupBlob());
}

/** True when this browser can share files (most phones; few desktop browsers). */
export function canShareFiles(): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false;
  try {
    const probe = new File(['{}'], 'probe.json', { type: 'application/json' });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export type ShareResult = 'shared' | 'downloaded' | 'cancelled';

/**
 * Browser only: opens the phone's share sheet with the backup file (Google Drive, Files,
 * Telegram, email…). Where files cannot be shared, it downloads the file instead.
 */
export async function shareBackup(): Promise<ShareResult> {
  const blob = await backupBlob();
  const file = new File([blob], backupFileName(), { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Hangeul Road backup' });
      return 'shared';
    } catch (error) {
      // Closing the share sheet is not an error, and nothing was saved.
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      // Any other failure (e.g. a share target that refuses JSON): fall back to download.
    }
  }
  download(blob);
  return 'downloaded';
}
