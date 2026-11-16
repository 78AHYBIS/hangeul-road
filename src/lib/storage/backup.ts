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

/** Browser only: triggers a file download of the backup. */
export async function downloadBackup(): Promise<void> {
  const backup = await createBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = backupFileName();
  link.click();
  URL.revokeObjectURL(url);
}
